import { SERVER_ORIGIN } from '../services/api';

interface ClientAvatarProps {
    firstName?: string | null;
    lastName?: string | null;
    photoUrl?: string | null;
    size?: 'xs' | 'sm' | 'md';
}

const SIZE_CLASSES: Record<NonNullable<ClientAvatarProps['size']>, string> = {
    xs: 'w-6 h-6 text-[0.6rem]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
};

// Small circular client photo, used wherever a client's name is shown (Clients, Cases,
// Claims, Documents lists) so their picture is visible platform-wide, not just on their
// own dashboard. Falls back to initials when no photo has been uploaded.
export default function ClientAvatar({ firstName, lastName, photoUrl, size = 'sm' }: ClientAvatarProps) {
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
    const sizeClass = SIZE_CLASSES[size];

    return (
        <span
            className={`inline-flex ${sizeClass} rounded-full overflow-hidden items-center justify-center flex-shrink-0`}
            style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-border)' }}
        >
            {photoUrl ? (
                <img
                    src={`${SERVER_ORIGIN}${photoUrl}`}
                    alt={`${firstName || ''} ${lastName || ''}`.trim()}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className="font-bold" style={{ color: 'var(--brand-accent)' }}>{initials}</span>
            )}
        </span>
    );
}
