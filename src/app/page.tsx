import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/icons/logo'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="font-bold text-lg">KyozoVerse</span>
        </Link>
        <nav>
          <Button asChild variant="ghost">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/kyozo-demo">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1 flex items-center justify-center text-center p-4">
        <div className="space-y-6 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-foreground">
            Welcome to the <span className="text-primary">KyozoVerse</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
            Create, manage, and grow your communities like never before. A unified platform for creators and members.
          </p>
          <div>
            <Button size="lg" asChild>
              <Link href="/kyozo-demo">Explore Communities</Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} KyozoVerse. All rights reserved.
      </footer>
    </div>
  );
}
