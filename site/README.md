# mayotti.com

Static pages for the public website, deployed as-is (no build step):

- `/` – index.html (simple landing page)
- `/privacy` – privacy.html (linked from the app, the RevenueCat paywall and App Store Connect)
- `/support` – support.html (App Store Connect "Support URL")

Terms of Use link to Apple's standard EULA:
https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Hosting: Cloudflare Pages (or any static host) with the build output directory set to `site`
and no build command. Keep the privacy policy in sync with what the app actually does
(see "Data Flow" in /CLAUDE.md) and update the "Effective" date when it changes.
