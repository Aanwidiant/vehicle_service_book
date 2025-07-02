import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Vehicle Service Book API',
    description: 'App vehicle service book rest API',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en'>
            <body>{children}</body>
        </html>
    );
}
