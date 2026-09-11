import os, sys, urllib.request, zipfile, tarfile

sdk_dir = '/tmp/android-sdk'
cmdline_tools_url = 'https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip'
zip_path = '/tmp/commandlinetools.zip'

os.makedirs(sdk_dir, exist_ok=True)
local_props = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'android', 'local.properties')

print(f"[Android SDK] Writing sdk.dir to {local_props}...")
with open(local_props, 'w') as f:
    f.write(f"sdk.dir={sdk_dir}\n")

if not os.path.exists(os.path.join(sdk_dir, 'cmdline-tools')):
    print(f"[Android SDK] Downloading Command Line Tools from Google...")
    try:
        urllib.request.urlretrieve(cmdline_tools_url, zip_path)
        print("[Android SDK] Extracting Command Line Tools...")
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(os.path.join(sdk_dir, 'cmdline-tools'))
        print("[Android SDK] Command Line Tools ready.")
    except Exception as e:
        print("[Android SDK] Download notice:", e)
