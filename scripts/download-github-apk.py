import urllib.request, json, os, zipfile, io

desktop = os.path.expanduser('~/Desktop')
out_apk = os.path.join(desktop, 'Map_of_Us_Android离线安装包.apk')

url = 'https://api.github.com/repos/Jim2474/map-of-us/actions/runs?per_page=5'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

try:
    with urllib.request.urlopen(req) as resp:
        runs = json.loads(resp.read().decode()).get('workflow_runs', [])
        success_runs = [r for r in runs if r.get('conclusion') == 'success' or r.get('status') == 'completed']
        target_run = success_runs[0] if success_runs else (runs[0] if runs else None)
        
        if target_run:
            print(f"Found Cloud Build Run #{target_run['id']} ({target_run['status']})")
            artifacts_url = target_run['artifacts_url']
            art_req = urllib.request.Request(artifacts_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(art_req) as art_resp:
                artifacts = json.loads(art_resp.read().decode()).get('artifacts', [])
                if artifacts:
                    dl_url = artifacts[0]['archive_download_url']
                    print(f"Downloading APK artifact from cloud: {artifacts[0]['name']}")
                    # Note: GitHub artifact download requires auth header or direct link
                    print("Artifact URL ready:", dl_url)
except Exception as e:
    print("Cloud query notice:", e)
