import React, { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import '../MDRS-main/src/index.css';

const ModelStudioApp = React.lazy(() =>
  import('../MDRS-main/src/ModelStudioApp').then((m) => ({ default: m.ModelStudioApp })),
);

const ModelFaceGen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="mdrs-studio-embed fixed inset-0 z-[200] flex flex-col bg-white">
      <button
        type="button"
        onClick={onBack}
        className="absolute left-[6.5rem] top-5 z-[220] flex items-center gap-2 border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-black shadow-sm transition hover:border-black"
        aria-label="返回首页"
      >
        <ArrowLeft size={14} />
        返回
      </button>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-white text-[10px] font-bold uppercase tracking-widest text-black/40">
            加载模特工作室…
          </div>
        }
      >
        <ModelStudioApp embed />
      </Suspense>
    </div>
  );
};

export default ModelFaceGen;
