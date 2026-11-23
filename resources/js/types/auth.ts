export type AcceptedDivisionNav = {
    id: number;
    name: string;
    event_id: number;
    event_title: string;
    event_status: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
    avatar?: string;
    bio?: string | null;
    email_verified_at: string | null;
    roles?: string[];
    verified_hours?: number;
    accepted_divisions?: AcceptedDivisionNav[];
    /* @chisel-2fa */
    two_factor_enabled?: boolean;
    /* @end-chisel-2fa */
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type FlashMessages = {
    success?: string | null;
    error?: string | null;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

/* @chisel-2fa */
export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
/* @end-chisel-2fa */
