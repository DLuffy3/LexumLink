import { useRef } from 'react';

interface SignatureUploadProps {
    dataUrl: string | null;
    onChange: (dataUrl: string | null) => void;
    error: string;
    setError: (msg: string) => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

// Alternative to SignaturePad — lets someone browse for an existing signature image
// (a photo or scan) instead of drawing one, producing the same base64 data-URL shape
// so the rest of the sign-up flow doesn't need to know which method was used.
export default function SignatureUpload({ dataUrl, onChange, error, setError }: SignatureUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File | undefined) => {
        if (!file) return;
        setError('');

        if (!ACCEPTED.includes(file.type)) {
            setError('Please upload a PNG, JPG or WEBP image.');
            return;
        }
        if (file.size > MAX_SIZE) {
            setError('Image is too large. Please use one 5MB or smaller.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => onChange(reader.result as string);
        reader.onerror = () => setError('Could not read that file. Please try again.');
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        onChange(null);
        setError('');
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div>
            {dataUrl ? (
                <div className="bg-white border border-[var(--border)] rounded p-3 flex items-center justify-between gap-4">
                    <img src={dataUrl} alt="Uploaded signature" className="max-h-24 max-w-[70%] object-contain" />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="text-xs font-medium text-[var(--brand-accent)] hover:underline whitespace-nowrap"
                    >
                        Remove
                    </button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--border)] rounded-lg py-8 cursor-pointer bg-[var(--overlay-weak)] hover:bg-[var(--overlay-med)] transition-colors">
                    <span className="text-sm text-[var(--muted)]">Click to browse for an image of your signature</span>
                    <span className="text-xs text-[var(--faint)]">PNG, JPG or WEBP — up to 5MB</span>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                </label>
            )}
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
}
