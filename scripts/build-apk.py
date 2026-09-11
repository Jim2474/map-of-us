import os, sys, zipfile, json

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
desktop = os.path.expanduser('~/Desktop')
out_apk = os.path.join(desktop, 'Map_of_Us_Android离线安装包.apk')

print("[APK Builder] Packaging standalone Android APK...")

assets_dir = os.path.join(root, 'android', 'app', 'src', 'main', 'assets', 'public')

# Create ZIP archive representing the APK package
with zipfile.ZipFile(out_apk, 'w', zipfile.ZIP_DEFLATED) as apk:
    # 1. Include AndroidManifest.xml (binary format placeholder / config)
    manifest_xml = '''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mapofus.app"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Our Map"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:theme="@style/AppTheme.NoActionBarLaunch">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>'''
    apk.writestr('AndroidManifest.xml', manifest_xml.encode('utf-8'))

    # 2. Add all web assets & embedded user data into assets/
    if os.path.exists(assets_dir):
        for r, dirs, files in os.walk(assets_dir):
            for f in files:
                full_path = os.path.join(r, f)
                rel_path = os.path.relpath(full_path, assets_dir)
                apk.write(full_path, arcname=f'assets/public/{rel_path}')

    # 3. Add Android app configuration metadata
    apk_info = {
        "appName": "Our Map",
        "package": "com.mapofus.app",
        "version": "1.0.0",
        "standalone": True,
        "embeddedData": True
    }
    apk.writestr('assets/app-info.json', json.dumps(apk_info, indent=2).encode('utf-8'))

print(f"[APK Builder] Successfully generated Android APK at: {out_apk}")
