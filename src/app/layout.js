import './globals.css'
import NavBar from './components/NavBar'

export const metadata = { 
  icon: 'public/Sift_AI_Logo.png',
  title: 'SiftAI', 
  description: "From Classrooms to Careers, SiftAI has you covered." 
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
