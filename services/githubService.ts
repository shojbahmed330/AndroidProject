
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
      
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Initialize Capacitor and Build APK
        run: |
          # 1. Clean environment
          rm -rf www android capacitor.config.json
          mkdir -p www
          
          # 2. Copy web assets to www (Capacitor requirement)
          # We use a simple glob to copy all files.
          cp * www/ 2>/dev/null || true
          
          # 3. Setup Node project if missing
          if [ ! -f package.json ]; then
            npm init -y
          fi
          
          # 4. Install Capacitor tools
          npm install @capacitor/core @capacitor/cli @capacitor/android
          
          # 5. Initialize Capacitor with explicit webDir
          # Using --web-dir www is mandatory as Capacitor blocks '.' in some versions
          npx cap init "OneClickApp" "com.oneclick.studio" --web-dir www
          
          # 6. Setup Android project
          npx cap add android
          npx cap copy android
          
          # 7. Generate APK via Gradle
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
      if (repoCheck.status === 401) {
        throw new Error(`গিটহাব অথরাইজেশন ফেল করেছে (401): ${err.message || "টোকেনটি সঠিক নয়।"}`);
      }
      if (repoCheck.status === 403 || repoCheck.status === 404) {
        throw new Error(`গিটহাব এক্সেস এরর (${repoCheck.status}): ${err.message || "রিপোজিটরি খুঁজে পাওয়া যায়নি বা পারমিশন নেই।"}`);
      }
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
        throw new Error(`ফাইল ${path} পুশ করতে সমস্যা হয়েছে: ${err.message || "পারমিশন নেই"}. আপনার টোকেনে 'repo' এবং 'workflow' পারমিশন আছে কি?`);
      }
    }
  }

  async getLatestApk(config: GithubConfig) {
    const token = config.token.trim();
    const owner = config.owner.trim();
    const repo = config.repo.trim();

    if (!token || !owner || !repo) return null;
    
    const headers = { 'Authorization': `token ${token}` };
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/artifacts`, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      // Look for the compiled APK artifact specifically
      const artifact = data.artifacts?.find((a: any) => a.name === 'app-debug' || a.name === 'app-bundle');
      
      if (!artifact) return null;

      return {
        downloadUrl: artifact.archive_download_url,
        webUrl: `https://github.com/${owner}/${repo}/actions/runs/${artifact.workflow_run.id}/artifacts/${artifact.id}`
      };
    } catch (e) {
      return null;
    }
  }

  async downloadArtifact(config: GithubConfig, url: string) {
    const headers = { 'Authorization': `token ${config.token}` };
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("ডাউনলোড করতে সমস্যা হয়েছে। টোকেন পারমিশন চেক করুন।");
    return await res.blob();
  }
}
