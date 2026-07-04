export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-0 text-center">
      <div className="container mx-auto flex h-16 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ShopSphere. Built with React &
          Spring Boot.
        </p>
      </div>
    </footer>
  );
}
