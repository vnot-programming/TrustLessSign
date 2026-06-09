# TrustlessSign macOS App Wrapper

This directory is a placeholder for the native macOS Cocoa wrapper application project.

## How to Build & Package in Xcode

To run and compile the Safari Web Extension on macOS:

1. Open **Xcode** and select **Create a new Xcode project**.
2. Under macOS, choose **Safari Extension App** template.
3. Name the project `TrustlessSign` and select Swift.
4. Replace the contents of the generated `Resources` folder inside Xcode with the contents of the `/safari-extension/Resources` directory.
5. Build and run the app.
6. Open **Safari -> Settings -> Extensions**, enable **TrustlessSign**, and grant permissions to access local or cloud domains.
