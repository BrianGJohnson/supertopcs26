import React, { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { IconLoader2 } from "@tabler/icons-react";
import { BlueprintPageContent } from "./_components/BlueprintPageContent";

function PageLoadingFallback() {
    return (
        <PageShell>
            <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
                <MemberHeader />
                <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-16 text-center">
                    <div className="flex flex-col items-center gap-6">
                        <IconLoader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-white/75 text-xl font-medium">Loading Blueprint...</p>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

export default function BlueprintPage() {
    return (
        <Suspense fallback={<PageLoadingFallback />}>
            <BlueprintPageContent />
        </Suspense>
    );
}
