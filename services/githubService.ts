
import { GithubConfig } from "../types";

export class GithubService {
  private workflowYaml = `name: Build Android APK
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          check-latest: true

      - name: Initialize Capacitor and Build APK
        run: |
          # Verify Node version for debug
          node -v
          
          # 1. Clean and Setup directories
          rm -rf www android capacitor.config.json
          mkdir -p www
          
          # 2. Sync web assets
          cp index.html main.js style.css www/ 2>/dev/null || true
          if [ ! -f www/index.html ]; then
            find . -maxdepth 1 -type f -not -name "package*" -exec cp {} www/ \;
          fi
          
          # 3. Setup Project
          if [ ! -f package.json ]; then
            npm init -y
          fi
          
          # 4. Install Dependencies
          npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest
          
          # 5. Capacitor Init
          npx cap init "OneClickApp" "com.oneclick.studio" --web-dir www
          
          # 6. Add Android Platform
          npx cap add android
          
          # 7. CRITICAL FIXES: Java 21 & Kotlin Duplication
          # Enable Jetifier for backward compatibility
          echo "android.enableJetifier=true" >> android/gradle.properties
          echo "android.useAndroidX=true" >> android/gradle.properties
          
          # Force Java 21 in build.gradle
          sed -i 's/JavaVersion.VERSION_17/JavaVersion.VERSION_21/g' android/app/build.gradle
          sed -i 's/JavaVersion.VERSION_11/JavaVersion.VERSION_21/g' android/app/build.gradle
          sed -i 's/JavaVersion.VERSION_1_8/JavaVersion.VERSION_21/g' android/app/build.gradle
          
          # Fix Kotlin Duplicate Classes and Resolution Strategy
          echo "" >> android/app/build.gradle
          echo "android {" >> android/app/build.gradle
          echo "    packagingOptions {" >> android/app/build.gradle
          echo "        resources {" >> android/app/build.gradle
          echo "            pickFirst 'META-INF/kotlin-stdlib.kotlin_module'" >> android/app/build.gradle
          echo "            pickFirst 'META-INF/kotlin-stdlib-jdk8.kotlin_module'" >> android/app/build.gradle
          echo "            pickFirst 'META-INF/kotlin-stdlib-jdk7.kotlin_module'" >> android/app/build.gradle
          echo "            pickFirst 'META-INF/AL2.0'" >> android/app/build.gradle
          echo "            pickFirst 'META-INF/LGPL2.1'" >> android/app/build.gradle
          echo "        }" >> android/app/build.gradle
          echo "    }" >> android/app/build.gradle
          echo "}" >> android/app/build.gradle
          echo "" >> android/app/build.gradle
          echo "configurations.all {" >> android/app/build.gradle
          echo "    resolutionStrategy {" >> android/app/build.gradle
          echo "        force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.10'" >> android/app/build.gradle
          echo "        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.10'" >> android/app/build.gradle
          echo "        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.10'" >> android/app/build.gradle
          echo "    }" >> android/app/build.gradle
          echo "}" >> android/app/build.gradle

          npx cap copy android
          
          # 8. Build APK
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error`;

  private toBase64(str: string): string {
    try {
      const bytes = new TextEncoder().encode(str);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (e) {
      return btoa(unescape(encodeURIComponent(str)));
    }
  }

  async pushToGithub(config: GithubConfig, files: Record<string, string>) {
    const token = config.token.trim();
    const owner = config.owner.trim();
    const repo = config.repo.trim();

    if (!token || !owner || !repo) throw new Error("গিটহাব কনফিগারেশন ইনভ্যালিড। লোগোতে ৩ বার ক্লিক করে সেটিংস চেক করুন।");

    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const headers = {
      'Authorization': `token ${token}`, 
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    const repoCheck = await fetch(baseUrl, { headers });
    if (!repoCheck.ok) {
      const err = await repoCheck.json().catch(() => ({}));
      throw new Error(`গিটহাব কানেকশন এরর: ${err.message || "অজানা সমস্যা"}`);
    }

    const allFiles = { 
        ...files, 
        '.github/workflows/android.yml': this.workflowYaml 
    };

    for (const [path, content] of Object.entries(allFiles)) {
      const getRes = await fetch(`${baseUrl}/contents/${path}`, { headers });
      let sha: string | undefined;
      
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      }

      const putRes = await fetch(`${baseUrl}/contents/${path}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Update ${path} via OneClick Studio`,
          content: this.toBase64(content),
          sha: sha
        })
      });

      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}));
        throw new Error(`ফাইল ${path} পুশ করতে সমস্যা হয়েছে: ${err.message || "পারমিশন নেই"}.`);
      }
    }
  }

  async getLatestApk(config: GithubConfig) {
    const token = config.token.trim();
    const owner = config.owner.trim();
    const repo = config.repo.trim();

    if (!token || !owner || !repo) return null;
    
    const headers = { 
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };
    
    try {
      // ১. লেটেস্ট রান ফেচ করা
      const runsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`, { headers });
      if (!runsRes.ok) return null;
      const runsData = await runsRes.json();
      const latestRun = runsData.workflow_runs?.[0];

      // যদি রান এখনো শেষ না হয় বা সফল না হয়, তবে ওয়েট করতে হবে (null রিটার্ন করবে)
      if (!latestRun || latestRun.status !== 'completed' || latestRun.conclusion !== 'success') {
        return null; 
      }

      // ২. ওই সুনির্দিষ্ট রানের জন্য আর্টিফ্যাক্ট ফেচ করা
      const artifactsRes = await fetch(latestRun.artifacts_url, { headers });
      if (!artifactsRes.ok) return null;
      const data = await artifactsRes.json();
      const artifact = data.artifacts?.find((a: any) => a.name === 'app-debug' || a.name === 'app-bundle');
      
      if (!artifact) return null;

      return {
        downloadUrl: artifact.archive_download_url,
        webUrl: latestRun.html_url // কিউআর কোডের জন্য রানের ডাইরেক্ট লিঙ্ক
      };
    } catch (e) {
      console.error("getLatestApk error:", e);
      return null;
    }
  }

  async downloadArtifact(config: GithubConfig, url: string) {
    const headers = { 'Authorization': `token ${config.token}` };
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("ডাউনলোড এরর।");
    return await res.blob();
  }
}
