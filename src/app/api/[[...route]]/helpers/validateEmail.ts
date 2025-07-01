const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): string | null => {
    if (!emailRegex.test(email)) {
        return 'Invalid email format.';
    }
    return null;
};
