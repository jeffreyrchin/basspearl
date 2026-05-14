import { FEEDBACK_FORM_URL } from "../constants";
import { useLegalStore } from "../store/useLegalStore";

export const Footer = () => {
    const { openLegal } = useLegalStore();
    return (
        <footer className="py-4 md:h-8 bg-transparent px-4 md:px-6 flex flex-row items-center justify-between gap-4 z-footer w-full">
            <span className="text-[11px] font-bold tracking-widest text-white/70 uppercase">© 2026 basspearl.com</span>
            <div className="flex items-center gap-6 text-[11px] font-bold tracking-widest text-white/70 uppercase pointer-events-auto">
                <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors uppercase">Feedback</a>
                <button onClick={() => openLegal()} className="hover:text-white transition-colors cursor-pointer uppercase">Privacy & Terms</button>
            </div>
        </footer>
    )
}