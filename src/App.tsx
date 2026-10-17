import { useState } from "react";
import { parseAlbertReceipt, type ParsedReceipt } from "./lib/albert";
import { formatCzk } from "./lib/money";
import { extractRows } from "./lib/pdfText";
import { useSession } from "./auth/useSession";
import "./App.css";
import LoginForm from "./auth/LoginForm";
import { supabase } from "./lib/supabase";

function App() {
    const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const session = useSession();

    if (session === undefined) return null;

    if (session === null) return <LoginForm />;

    async function handleFile(file: File | undefined) {
        if (!file) return;
        setError(null);
        setReceipt(null);
        try {
            setReceipt(
                parseAlbertReceipt(await extractRows(await file.arrayBuffer())),
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    async function handleSaveReceipt() {
        if (!receipt) return;
        setSaving(true);
        const payload = {
            ...receipt,
            purchasedAt: new Date(receipt.purchasedAt!).toISOString(),
        };
        const { error } = await supabase.rpc("save_receipt", {
            p_receipt: payload,
        });
        if (error) setError(error.message);
        setSaving(false);
        setSaved(true);
    }

    return (
        <main>
            <button onClick={() => supabase.auth.signOut()}>Sign out</button>
            <h1>Účtenky</h1>
            <label className="drop">
                Choose an Albert PDF receipt
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />
            </label>

            {error && (
                <p className="warning">Could not read the PDF: {error}</p>
            )}

            {receipt && (
                <>
                    <section>
                        <p className="meta">
                            {receipt.chain} ·{" "}
                            {receipt.storeName ?? "unknown store"}
                            {receipt.purchasedAt &&
                                ` · ${new Date(receipt.purchasedAt).toLocaleString("cs-CZ")}`}
                        </p>
                        {receipt.warnings.map((w) => (
                            <p key={w} className="warning">
                                ⚠ {w}
                            </p>
                        ))}
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Unit price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receipt.items.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.name}</td>
                                        <td>
                                            {item.quantity}
                                            {item.unit && ` ${item.unit}`}
                                        </td>
                                        <td>{formatCzk(item.unitPrice)}</td>
                                        <td>{formatCzk(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3}>Celkem</td>
                                    <td>{formatCzk(receipt.total)}</td>
                                </tr>
                                {receipt.savings !== undefined && (
                                    <tr>
                                        <td colSpan={3}>Saved by promotions</td>
                                        <td>{formatCzk(receipt.savings)}</td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </section>
                    <button
                        onClick={handleSaveReceipt}
                        disabled={
                            saving || saved || receipt.warnings.length > 0
                        }
                    >
                        {saved
                            ? "Saved receipt"
                            : saving
                              ? "Saving receipt"
                              : "Save receipt"}
                    </button>
                </>
            )}
        </main>
    );
}

export default App;
