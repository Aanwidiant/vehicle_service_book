const validatePasswordContain = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export const validatePassword = (password: string): string | null => {
    if (!validatePasswordContain.test(password)) {
        return 'Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a special character.';
    }
    return null;
};
