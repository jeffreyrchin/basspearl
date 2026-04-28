const LoadingSpinner = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 shrink-0 border-2 border-indigo-500/20 border-b-indigo-500 rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.15em]">
                Loading...
            </span>
        </div>
    );
};

export default LoadingSpinner;
