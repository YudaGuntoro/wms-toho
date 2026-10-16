import type { Metadata } from 'next';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';

// All application pages render per request; static files keep their own cache policy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    default: "Toho Technology Indonesia Warehouse Management System",
    template: "%s | Toho Technology Indonesia",
  },
  description: "Warehouse Management System for Toho Technology Indonesia",
  icons: {
    apple: "/icon.png?v=wms-toho-logo",
    icon: "/icon.png?v=wms-toho-logo",
    shortcut: "/favicon.ico?v=wms-toho-logo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-outfit dark:bg-gray-900">
        <ThemeProvider>
          <ToastProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
