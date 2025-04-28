'use client'

// Import External
import { useRouter } from 'next/navigation';

/**
 * This component acts as a next.js compatible link
 * 
 * @param className The style class name
 * 
 * @param href The link
 * 
 * @param children The link body
 * 
 * @returns A usable link
 */
export default function Link({className, href, children}: {className: string, href: string, children: React.ReactNode}){

  const router = useRouter();

  const direct = () => {
    router.push(href);
  }

  return (
    <div className={className} onClick={direct}>{children}</div>
  );
}