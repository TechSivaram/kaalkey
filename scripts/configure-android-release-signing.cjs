#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const gradleFile = path.join(process.cwd(), "android", "app", "build.gradle");
if (!fs.existsSync(gradleFile)) {
  throw new Error(`Generated Android Gradle file not found: ${gradleFile}`);
}

const required = [
  "ANDROID_KEYSTORE_FILE",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_ALIAS",
  "ANDROID_KEY_PASSWORD",
  "ANDROID_VERSION_CODE",
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
}

const versionCode = Number(process.env.ANDROID_VERSION_CODE);
if (!Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2100000000) {
  throw new Error("ANDROID_VERSION_CODE must be an integer between 1 and 2100000000.");
}

let gradle = fs.readFileSync(gradleFile, "utf8");
const versionPattern = /(\bversionCode\s+)\d+/;
if (!versionPattern.test(gradle)) {
  throw new Error(
    "Could not find a literal versionCode in android/app/build.gradle; refusing to build with an unverified version.",
  );
}
gradle = gradle.replace(versionPattern, `$1${versionCode}`);

const marker = "// KaalKey GitHub Actions release signing";
if (!gradle.includes(marker)) {
  gradle += `

// KaalKey GitHub Actions release signing
// Credentials are read from the runner environment and are never written to this file.
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
`;
}

fs.writeFileSync(gradleFile, gradle);
console.log(`Configured Android release signing and versionCode ${versionCode}.`);
