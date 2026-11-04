# KaalKey performance profiling

The account list now has React Profiler instrumentation in development builds. It reports React render passes taking at least 4 ms for individual account cards and the aggregate account list.

## How to profile

1. Run the app in a development build (`npx expo start` or the normal platform development command).
2. Add or restore 50–100 test authenticator accounts. Use test-only accounts/secrets.
3. Open the account list and scroll through the list several times.
4. Watch the Metro/device/browser console for `[KaalKey profiler]` entries.
5. Compare `actual` and `base` durations. High actual durations identify expensive render passes; a large base duration indicates the subtree has substantial render work even when memoization skips much of it.
6. Repeat after searching, sorting, adding, editing, and deleting accounts.

The React Profiler measures React render/commit work. It does not measure native GPU drawing, layout on the native UI thread, dropped frames, or battery use. Use React Native DevTools/Hermes profiling and platform frame tools for those measurements. Profiling is guarded by `__DEV__` and does not log in production builds.
