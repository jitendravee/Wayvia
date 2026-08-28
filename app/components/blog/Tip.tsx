import { Lightbulb } from "lucide-react";

export default function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-violet-soft/60 px-4 py-3.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet text-white">
        <Lightbulb size={13} />
      </span>
      <p className="font-sans text-[13.5px] leading-relaxed text-violet-dark">
        <span className="font-semibold">Pro tip:</span> {text}
      </p>
    </div>
  );
}
