# mayotti.com

Public website for the Mayotti iPhone app, served by GitHub Pages at https://mayotti.com.

- `/` – index.html (landing page; styles in landing.css, screenshots in images/)
- `/privacy` – privacy.html (linked from the app, the paywall and App Store Connect)
- `/support` – support.html (App Store Connect Support URL)

Terms of Use link to Apple's standard EULA:
https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Plain static files, no build step. `CNAME` sets the custom domain; `.nojekyll` serves files as-is.
Keep the privacy policy in sync with what the app actually does, and update its "Effective" date when it changes.

## App Store link
When Mayotti is live, set `APP_STORE_URL` near the bottom of `index.html` to the real App Store link.
All "Coming soon" buttons then switch to "Download on the App Store" automatically.
