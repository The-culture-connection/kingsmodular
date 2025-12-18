'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-base text-foreground">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'h-16 bg-base/95 backdrop-blur-md shadow-lg' : 'h-24 bg-base/90 backdrop-blur-sm'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <Link href="/" className="flex-shrink-0 transition-transform duration-300 hover:scale-105">
              <Image
                src="/Assets/Logos/PrimaryLogoWhite.png"
                alt="Kings Modular LLC."
                width={scrolled ? 150 : 250}
                height={scrolled ? 45 : 75}
                className={`transition-all duration-300 ${scrolled ? 'h-10' : 'h-16'} w-auto`}
              />
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#about" className="text-foreground hover:text-accent transition-colors font-medium">
                About us
              </Link>
              <Link href="#services" className="text-foreground hover:text-accent transition-colors font-medium">
                Services
              </Link>
              <Link href="#projects" className="text-foreground hover:text-accent transition-colors font-medium">
                Projects
              </Link>
              <Link href="#contact" className="text-foreground hover:text-accent transition-colors font-medium">
                Contact us
              </Link>
            </nav>
            <Link href="/auth/signup?role=customer">
              <Button variant="primary" className={`${scrolled ? 'text-sm px-4 py-2' : 'text-base px-6 py-3'}`}>
                Request a quote
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center justify-center bg-base pt-24">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover opacity-20"
        >
          <source src="public\Assets\Videos\jobsiteanim.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="mb-12">
              <Image
                src="/Assets/Logos/PrimaryLogoWhite.png"
                alt="Kings Modular LLC"
                width={600}
                height={180}
                className="h-40 md:h-52 w-auto mx-auto drop-shadow-2xl"
              />
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 font-gotham text-foreground drop-shadow-2xl max-w-5xl leading-tight">
              The Gold Standard of Jobsite Offices
            </h1>
            <p className="text-2xl md:text-3xl mb-10 text-foreground/95 font-medium max-w-4xl drop-shadow-lg">
              Quick and safe solutions with experienced teams that can handle any size project
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-lg mb-10">
              <span className="px-6 py-3 border-2 border-accent bg-accent/20 text-accent rounded-lg font-semibold backdrop-blur-sm">Setup</span>
              <span className="px-6 py-3 border-2 border-accent bg-accent/20 text-accent rounded-lg font-semibold backdrop-blur-sm">Teardown</span>
              <span className="px-6 py-3 border-2 border-accent bg-accent/20 text-accent rounded-lg font-semibold backdrop-blur-sm">Welding</span>
              <span className="px-6 py-3 border-2 border-accent bg-accent/20 text-accent rounded-lg font-semibold backdrop-blur-sm">Remodel</span>
              <span className="px-6 py-3 border-2 border-accent bg-accent/20 text-accent rounded-lg font-semibold backdrop-blur-sm">Carpentry</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup?role=customer">
                <Button size="xl" variant="primary" className="text-xl px-10 py-6 font-bold">
                  Get Started
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="xl" variant="primary" className="text-xl px-10 py-6 font-bold">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Reach Section */}
      <section className="py-20 bg-base border-t border-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-gotham text-foreground">Our Reach</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-gotham text-foreground">
                Providing services throughout the eastern United States, with nationwide capability for large-scale projects.
              </h2>
              <p className="text-xl text-foreground/90 mb-6 leading-relaxed">
                Providing service throughout the eastern United States and nationwide for large-scale engagements.
              </p>
            </div>
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden border border-accent/20">
              <Image
                src="/Assets/General Photos/image3.png"
                alt="Mobile office trailer services"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tackling Projects Section */}
      <section className="py-20 bg-base border-t border-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden border border-accent/20 order-2 md:order-1">
              <Image
                src="/Assets/General Photos/image4.jpeg"
                alt="Project of any size"
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-gotham text-foreground">
                Tackling projects of any size
              </h2>
              <p className="text-xl text-foreground/90 mb-6 leading-relaxed">
                From small setups to massive builds, we handle it all with precision and efficiency. Your project, our expertise—let's get it done!
              </p>
              <Link href="#about">
                <Button variant="primary" className="bg-accent text-base hover:bg-accent/90 font-semibold">
                  MORE ABOUT US
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section id="about" className="py-20 bg-base border-t border-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-gotham text-foreground">Who We Are</h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-foreground/90 mb-12 text-center leading-relaxed">
              At Kings Modular LLC., we specialize in providing top-notch mobile office trailer services tailored to meet the unique needs of businesses of all sizes. With years of industry experience, our mission is to deliver reliable, efficient, and customized solutions—whether you require a temporary single-unit office or a large multi-unit complex.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 mt-16">
            <div>
              <div className="relative h-64 rounded-lg overflow-hidden mb-6 border border-accent/20">
                <Image
                  src="/Assets/General Photos/Image1.JPEG"
                  alt="Mobile Office Trailer Setup"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-gotham text-foreground">Professional Installation</h3>
              <p className="text-foreground/90 mb-4 text-lg leading-relaxed">Quick and seamless setup to get your workspace operational when you need it.</p>
              <p className="text-foreground/90 text-lg leading-relaxed"><strong className="text-accent">Scalable Solutions:</strong> From single units to multi-unit complexes, we handle projects of any size with precision.</p>
            </div>
            <div>
              <div className="relative h-64 rounded-lg overflow-hidden mb-6 border border-accent/20">
                <Image
                  src="/Assets/General Photos/Image2.png"
                  alt="Handling Any Size Complex"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-gotham text-foreground">Custom Design</h3>
              <p className="text-foreground/90 mb-4 text-lg leading-relaxed">Setting up complexes from single-unit offices to multi-unit configurations.</p>
              <p className="text-foreground/90 text-lg leading-relaxed"><strong className="text-accent">Expert Management:</strong> Professional handling of both small and large setups with efficiency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-base border-t border-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 font-gotham text-foreground">QUESTIONS?</h2>
          <a href="tel:+15133327834" className="text-4xl md:text-5xl text-accent font-bold hover:text-accent/80 transition-colors block">
            +1 513-332-7834
          </a>
        </div>
      </section>

      {/* Services Detail Section */}
      <section id="services" className="py-20 bg-base border-t border-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-3xl md:text-4xl text-accent font-semibold">We are one of the Leading Modular Companies</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-accent/10 border border-accent/20 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 font-gotham text-foreground">Tiedown and Securing</h3>
              <p className="text-foreground/90 mb-4 text-lg leading-relaxed">Safety First: Properly securing your mobile office trailers with high-quality tiedowns.</p>
            </div>
            <div className="bg-accent/10 border border-accent/20 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 font-gotham text-foreground">Mobile Office Setup</h3>
              <p className="text-foreground/90 mb-4 text-lg leading-relaxed">Scalable Solutions: From single units to multi-unit complex setups, we handle projects of any size with precision.</p>
            </div>
            <div className="bg-accent/10 border border-accent/20 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 font-gotham text-foreground">Gutter Installation</h3>
              <p className="text-foreground/90 mb-4 text-lg leading-relaxed">Protective Drainage: Custom gutters to divert water away, preventing water damage</p>
            </div>
            <div className="bg-accent/10 border border-accent/20 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 font-gotham text-foreground">Steps and Ramps</h3>
              <p className="text-foreground/90 mb-4 text-lg leading-relaxed">ADA/OSHA Compliance: Offering install and removal of ADA / OSHA compliant ramps & steps to meet all accessibility requirements.</p>
            </div>
            <div className="bg-accent/10 border border-accent/20 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 font-gotham text-foreground">Mobile Office Teardown</h3>
              <p className="text-foreground/90 mb-4 text-lg leading-relaxed">Efficient Removal: Safe and prompt disassembly when your project is complete or it's time to relocate.</p>
            </div>
            <div className="bg-accent/10 border border-accent/20 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 font-gotham text-foreground">Service Calls and Maintenance</h3>
              <p className="text-foreground/90 mb-4 text-lg leading-relaxed">Operational Efficiency: Addressing issues like leaking roofs or AC malfunctions to keep your office running smoothly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 bg-base border-t border-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-3xl md:text-4xl text-accent font-semibold mb-4">OUR SKILLS</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-gotham text-foreground">We Build More Than Structures – We Build Solutions</h2>
            <p className="text-xl text-foreground/90 max-w-3xl mx-auto leading-relaxed">
              We specialize in delivering tailored mobile office setups that meet your unique project needs. Our team of skilled professionals ensures that each installation is completed with precision and care, providing you with a ready-to-use workspace.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 mt-16">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4 font-gotham text-accent">Skilled Professionals:</h3>
              <p className="text-foreground/90 text-lg leading-relaxed">Industry experts committed to quality.</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4 font-gotham text-accent">Tailored Solutions:</h3>
              <p className="text-foreground/90 text-lg leading-relaxed">Customized to fit your specific requirements.</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4 font-gotham text-accent">Dependable Service:</h3>
              <p className="text-foreground/90 text-lg leading-relaxed">Reliable support from start to finish.</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4 font-gotham text-accent">180 day guarantee:</h3>
              <p className="text-foreground/90 text-lg leading-relaxed">We guarantee our projects will uphold our standards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-base border-t border-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-3xl md:text-4xl text-accent font-semibold mb-4">TESTIMONIALS</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-gotham text-foreground">What our Clients say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-accent/10 border border-accent/20 p-8 rounded-lg">
              <p className="text-xl text-foreground/90 mb-6 italic leading-relaxed">
                "Richard and his crew delivered exceptional service during our project setup. Their professionalism and efficiency made the process smooth and stress-free."
              </p>
              <p className="font-bold text-xl text-foreground">Evonne Walker</p>
              <p className="text-foreground/70 text-lg">Willscot, Columbus, OH.</p>
            </div>
            <div className="bg-accent/10 border border-accent/20 p-8 rounded-lg">
              <p className="text-xl text-foreground/90 mb-6 italic leading-relaxed">
                "From start to finish, Richard and his crew was responsive and dedicated. Their expertise is evident in their work."
              </p>
              <p className="font-bold text-xl text-foreground">Alexander Kahn</p>
              <p className="text-foreground/70 text-lg">United Rentals, Louisville, KY</p>
            </div>
            <div className="bg-accent/10 border border-accent/20 p-8 rounded-lg">
              <p className="text-xl text-foreground/90 mb-6 italic leading-relaxed">
                "Their attention to detail and commitment to quality are unparalleled. We highly recommend Richard and his crew for any mobile office needs."
              </p>
              <p className="font-bold text-xl text-foreground">Owen Burlington</p>
              <p className="text-foreground/70 text-lg">United Rentals, Louisville, KY</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section id="contact" className="py-20 bg-base border-t border-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Phone className="h-16 w-16 mx-auto mb-6 text-accent" />
          <a href="tel:+15133327834" className="text-4xl md:text-5xl text-accent font-bold hover:text-accent/80 transition-colors block mb-8">
            +1 513-332-7834
          </a>
          <p className="text-xl text-foreground/90 mb-8">Email: tara@kingsmodular.com</p>
          <Link href="/auth/signup?role=customer">
            <Button size="xl" variant="primary" className="text-xl px-10 py-6 bg-accent text-base hover:bg-accent/90 font-bold">
              Request a quote
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-base border-t border-accent/20 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-foreground/70">
            <p>Copyright 2024 Kings Modular LLC. All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  )
}