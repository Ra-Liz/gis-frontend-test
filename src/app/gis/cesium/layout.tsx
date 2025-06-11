import "/public/cesium/Widgets/widgets.css";

export default function PageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full h-full position-relative">{children}</div>;
}
