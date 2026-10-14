import type { Metadata } from 'next';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';

export const metadata: Metadata = {
  title: {
    default: "WMS-Toho Warehouse Management System",
    template: "%s | WMS-Toho",
  },
  description: "Warehouse Management System for WMS-Toho",
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
