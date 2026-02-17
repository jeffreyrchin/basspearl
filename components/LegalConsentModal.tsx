import React, { useEffect } from 'react';
import { useLegalStore } from '../store/useLegalStore';

const LegalConsentModal = () => {
    const { isLegalOpen, closeLegal } = useLegalStore();

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isLegalOpen) {
                closeLegal();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isLegalOpen, closeLegal]);

    if (!isLegalOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => closeLegal()}
            />

            <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[24px]">gavel</span>
                        <h2 className="text-xl font-bold uppercase tracking-wider">Privacy & Terms</h2>
                    </div>
                    <button onClick={closeLegal} className="text-white/40 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 text-white/80 text-sm leading-relaxed custom-scrollbar">
                    <section>
                        <h1 className="text-2xl font-bold text-white mb-2">Privacy Policy</h1>
                        <p className="text-white/60 mb-6 text-xs">Last Updated: February 17, 2026</p>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">1. Introduction</h3>
                                <p>Welcome to GlitchBrain.io. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">2. Information We Collect</h3>
                                <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-white/60">
                                    <li><strong>Identity Data:</strong> Includes username or similar identifier if you register an account.</li>
                                    <li><strong>Contact Data:</strong> Includes email address for account management.</li>
                                    <li><strong>Technical Data:</strong> Includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                                    <li><strong>Usage Data:</strong> Includes information about how you use our website, products and services.</li>
                                    <li><strong>Media Data (Images and Audio):</strong> Images and audio files you upload are processed locally in your browser to generate high-performance audio-reactive visualizers. Audio files are analyzed to create deterministic reactivity maps—no raw media data leaves your device. We do not store your original files on our servers.</li>
                                    <li><strong>Analytics Data:</strong> We collect refined telemetry using Google Analytics 4, including interaction timestamps, preset selections, effect toggles, and processing performance metrics. This data is anonymized and used exclusively to optimize the visual engine and identify performance bottlenecks.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">3. How We Collect Information</h3>
                                <p>We use different methods to collect data from and about you including through:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-white/60">
                                    <li><strong>Direct interactions:</strong> You may give us your Identity and Contact Data by filling in forms or by corresponding with us.</li>
                                    <li><strong>Automated technologies or interactions:</strong> As you interact with our website, we will automatically collect Technical Data about your equipment, browsing actions and patterns.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">4. How We Use Information</h3>
                                <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-white/60">
                                    <li>To provide the glitch art generation service.</li>
                                    <li>To manage your account and authentication via Firebase.</li>
                                    <li>To improve our website, products/services, marketing or customer relationships.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">5. Legal Basis for Processing (GDPR)</h3>
                                <p>We process your personal data under the following legal bases:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-white/60">
                                    <li><strong>Consent:</strong> When you agree to this policy.</li>
                                    <li><strong>Contract:</strong> To fulfill our service obligations to you.</li>
                                    <li><strong>Legitimate Interests:</strong> For analytics and security purposes.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">6. How We Share Information</h3>
                                <p>We do not sell your personal data. We may share your data with:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-white/60">
                                    <li><strong>Service Providers:</strong> Such as Firebase (Google) for authentication and hosting services.</li>
                                    <li><strong>Legal Requirements:</strong> If required by law or to protect our rights.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">7. Data Retention</h3>
                                <p>We retain personal data only for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements. Specific retention periods include:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-white/60">
                                    <li><strong>Account Data:</strong> Retained for the duration of your account's existence. Upon deletion, data is removed from active databases immediately and from backups within 30 days.</li>
                                    <li><strong>Media Data (Images and Audio):</strong> Not retained on our servers. Browser-local processing only—data is cleared when you close the session.</li>
                                    <li><strong>Usage/Analytics Data:</strong> Retained for a period of 24 months for trend analysis. This data is anonymized and does not include your uploaded images.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">8. Your Privacy Rights</h3>
                                <p>You have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.</p>
                                <p className="mt-2 text-white/60 text-xs bg-white/5 p-3 rounded">
                                    <strong>How to Exercise:</strong> To exercise any of these rights, please contact us at <span className="text-primary">jeffreyrchin.20@gmail.com</span> with the subject line "Privacy Rights Request". We will respond to your request within 30 days.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">9. California Privacy Rights (CCPA)</h3>
                                <p>California residents have the right to request information about the data we collect, sell, or disclose. We do not sell personal information as defined by the CCPA.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">10. EU Privacy Rights (GDPR)</h3>
                                <p>If you are in the EU, you have distinct rights under the GDPR regarding your data. You may exercise these rights by contacting us as described above. You also have the right to lodge a complaint with a supervisory authority.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">11. Children's Privacy</h3>
                                <p>Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">12. Data Security</h3>
                                <p>We implement security measures designed to protect your personal data from unauthorized access, loss, or disclosure. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">13. International Transfers</h3>
                                <p>Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">14. Third-Party Services</h3>
                                <p>We use the following third-party services to operate our website. By using our service, you agree to their respective terms.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-white/60">
                                    <li><strong>Google Firebase:</strong> Used for authentication. <a href="https://firebase.google.com/terms" className="text-primary hover:underline">Firebase Terms</a>.</li>
                                    <li><strong>Google Analytics (GA4):</strong> Used for usage telemetry and performance monitoring. <a href="https://policies.google.com/privacy" className="text-primary hover:underline">Google Privacy Policy</a>.</li>
                                    <li><strong>Cloudflare: </strong>Used for content delivery and DDoS protection. Cloudflare may collect certain information such as
                                        IP addresses, system configuration information, and other
                                        information about traffic to and from our website. <a href="https://www.cloudflare.com/privacy/" className="text-primary hover:underline">Cloudflare Privacy Policy</a>.</li>
                                    <li><strong>GitHub: </strong>Used for source code hosting and version control. <a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service" className="text-primary hover:underline">GitHub Terms of Service</a>.</li>
                                    <li><strong>Google Fonts: </strong>Used for loading custom fonts. <a href="https://developers.google.com/fonts/faq/privacy" className="text-primary hover:underline">Google Fonts Privacy Policy</a>.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">15. Cookies and Tracking</h3>
                                <p>We use local storage and necessary cookies to maintain your session and preferences. We also use analytics cookies (e.g., Google Analytics) to collect information about how you use our site. You can manage your cookie preferences through your browser settings.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">16. Do Not Track</h3>
                                <p>We honor Do Not Track signals and do not track, plant cookies, or use advertising when a Do Not Track (DNT) browser mechanism is in place.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">17. Changes to This Policy</h3>
                                <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">18. Contact Us</h3>
                                <p>If you have any questions about this Privacy Policy, please contact us at: jeffreyrchin.20@gmail.com</p>
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-white/10 my-8"></div>

                    <section>
                        <h1 className="text-2xl font-bold text-white mb-2">Terms of Service</h1>
                        <p className="text-white/60 mb-6 text-xs">Last Updated: February 17, 2026</p>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">1. Acceptance of Terms</h3>
                                <p>By accessing or using the GlitchBrain.io website and services, you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">2. Description of Service</h3>
                                <p>GlitchBrain.io provides a web-based graphics engine for generating audio-reactive visualizers and applying visual effects ("glitch effects") to user-uploaded images. The service allows for the real-time simulation and hardware-accelerated export of MP4 video files. All processing occurs client-side within your browser—no media files are uploaded to our servers.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">3. User Accounts</h3>
                                <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">4. User Content and Conduct</h3>
                                <p>By uploading images or audio files, you represent and warrant that you own or have the necessary rights, licenses, consents, and permissions to use and authorize us to process such content. You retain full ownership of your uploaded content and any visualizer videos generated by the Service. By using the Service, you grant GlitchBrain.io a temporary, limited license to process your content locally in your browser solely to provide the requested visual effects. You are responsible for ensuring your use of generated content complies with third-party copyrights (e.g., music licensing).</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">5. Prohibited Content</h3>
                                <p>You agree not to upload content that: (i) is illegal, defamatory, pornographic, harassing, or constitutes hate speech; (ii) infringes on any intellectual property rights, including copyrights, trademarks, or patents; or (iii) you do not have the right to use. Uploading copyrighted material without authorization from the rights holder is strictly prohibited. We reserve the right to refuse service to anyone found violating these terms.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">6. Intellectual Property Rights</h3>
                                <p>The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of GlitchBrain.io and its licensors.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">7. License Grant</h3>
                                <p>We grant you a limited, non-exclusive, non-transferable license to use the Service for personal and non-commercial purposes, subject to these Terms.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">8. Third-Party Services</h3>
                                <p>The Service may use third-party services (such as Firebase) that declare their own Terms of Service. By using the Service, you acknowledge and agree that GlitchBrain.io is not responsible for the availability of such external sites or resources.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">9. Disclaimers</h3>
                                <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">10. Limitation of Liability</h3>
                                <p>In no event shall GlitchBrain.io, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses. In no event shall GlitchBrain.io's total liability to you for all damages, losses, and causes of action exceed the amount you have paid GlitchBrain.io in the last six (6) months, or, if greater, one hundred dollars ($100).</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">11. Indemnification</h3>
                                <p>You agree to defend, indemnify and hold harmless GlitchBrain.io and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">12. DMCA and Copyright</h3>
                                <p>We respect the intellectual property rights of others. It is our policy to respond to any claim that Content posted on the Service infringes the copyright or other intellectual property infringement of any person.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">13. Termination</h3>
                                <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">14. Dispute Resolution</h3>
                                <p>If you have any concern or dispute about the Service, you agree to first try to resolve the dispute informally by contacting GlitchBrain.io.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">15. Arbitration Agreement</h3>
                                <p>For any dispute you have with GlitchBrain.io, you agree to first simply contact us and attempt to resolve the dispute with us informally. If GlitchBrain.io has not been able to resolve the dispute with you informally, we each agree to resolve any claim, dispute, or controversy via binding arbitration.</p>
                                <p className="mt-2 text-white/60 text-xs bg-white/5 p-3 rounded">
                                    <strong>Opt-Out:</strong> You may opt-out of this Agreement to arbitrate by sending a written notice to jeffreyrchin.20@gmail.com within 30 days of first accepting these Terms. Your notice must include your name and address, the email address used to set up your account (if you have one), and an unequivocal statement that you want to opt-out of this arbitration agreement.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">16. Class Action Waiver</h3>
                                <p>You agree that any arbitration or proceeding shall be limited to the dispute between us and you individually. To the full extent permitted by law, (i) no arbitration or proceeding shall be joined with any other; (ii) there is no right or authority for any dispute to be arbitrated or resolved on a class action-basis or to utilize class action procedures; and (iii) there is no right or authority for any dispute to be brought in a purported representative capacity on behalf of the general public or any other persons.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">17. Governing Law and Venue</h3>
                                <p>These Terms shall be governed and construed in accordance with the laws of Washington, United States, without regard to its conflict of law provisions.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">18. Changes to Terms</h3>
                                <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">19. Miscellaneous</h3>
                                <p>If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service.</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2 text-xs">20. Contact Information</h3>
                                <p>If you have any questions about these Terms, please contact us at jeffreyrchin.20@gmail.com</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 shrink-0 flex flex-col gap-4">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={closeLegal}
                            className="px-6 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white/60 font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalConsentModal;
