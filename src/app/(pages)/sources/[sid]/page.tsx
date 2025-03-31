import Stage from "./stage"

export default async function Page({ params }: { params: Promise<{ sid: string }> }) {
    const { sid } = await params;
    return <Stage sid={sid} />
}