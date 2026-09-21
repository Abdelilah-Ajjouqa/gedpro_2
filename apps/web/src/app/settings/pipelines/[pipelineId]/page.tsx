import { AppShell } from '@/components/app-shell/app-shell'; import { ProtectedRoute } from '@/components/auth/protected-route'; import { PipelineWorkspace } from '@/features/pipelines/pipeline-workspace';
export default function Page() { return <ProtectedRoute capability="pipelines:read"><AppShell><PipelineWorkspace /></AppShell></ProtectedRoute>; }
