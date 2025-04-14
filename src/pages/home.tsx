import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import fundoBackground from "../assets/img/fundo_background.png";
import logo from "../assets/img/logo_2.png";

export default function HomePage() {
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({
    features: false,
    services: false,
    testimonials: false,
  });

  const featuresRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);

  // Intersection Observer for animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.2,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Get section id from data attribute
          const sectionId = entry.target.getAttribute("data-section");
          if (sectionId) {
            setIsVisible((prev) => ({ ...prev, [sectionId]: true }));
          }
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    // Observe all section refs
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (servicesRef.current) observer.observe(servicesRef.current);
    if (testimonialsRef.current) observer.observe(testimonialsRef.current);

    return () => observer.disconnect();
  }, []);

  const services = [
    {
      name: "Corte Disfarçado",
      price: "R$ 35.00",
      image:
        "https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      description:
        "Corte moderno com degradê suave nas laterais e nuca, realizado com máquina e tesoura, finalizado com navalha para um acabamento perfeito. Inclui lavagem e produtos especiais.",
    },
    {
      name: "Corte pente único",
      price: "R$ 25.00",
      image:
        "https://m.media-amazon.com/images/I/81H6owpa6cL._AC_UF1000,1000_QL80_.jpg",
      description:
        "Corte tradicional com pente e tesoura em comprimento único, perfeito para quem prefere um visual clássico e uniforme. Inclui lavagem e finalização.",
    },
    {
      name: "Combo (Cabelo + Barba + Sobrancelha)",
      price: "R$ 55.00",
      image:
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      description:
        "Corte, pintura e sobrancelha com produtos de alta qualidade para garantir um visual duradouro e elegante.",
    },
    {
      name: "Combo Cabelo+Sobrancelha",
      price: "R$ 40.00",
      image:
        "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      description: "Experiência premium com produtos exclusivos",
    },
  ];

  const testimonials = [
    {
      name: "João Silva",
      text: "Melhor barbearia da cidade! Atendimento impecável e corte perfeito.",
      rating: 5,
    },
    {
      name: "Pedro Oliveira",
      text: "O ambiente é incrível e os profissionais são muito bem treinados. Recomendo!",
      rating: 5,
    },
    {
      name: "Carlos Mendes",
      text: "Produtos de primeira linha e o atendimento é sempre pontual. Virei cliente fiel.",
      rating: 4,
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 md:space-y-20">
      {/* Hero Section - Made more responsive */}
      <section className="relative min-h-[80vh] md:h-screen flex items-center text-center">
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
          <img
            src={fundoBackground}
            alt="Barbearia Andin"
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-lg sm:max-w-xl md:max-w-2xl mx-auto text-center text-white space-y-4 sm:space-y-6 md:space-y-8">
            <div className="transform hover:scale-105 transition-transform duration-500 ">
              <a className="flex justify-center items-center" href="/">
                <img
                  src={logo}
                  alt="Logo"
                  className="mx-auto w-full max-w-[200px] sm:max-w-[250px] md:max-w-xs"
                />
              </a>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              ESTILO E <span className="text-amber-500">SOFISTICAÇÃO</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-light tracking-wide">
              Tradição e estilo em cada corte. Uma experiência única de
              barbearia moderna.
            </p>
            <div className="pt-2 sm:pt-4">
              <Link
                to="/book"
                className="inline-block bg-amber-500 text-black hover:bg-amber-600 font-bold py-3 sm:py-4 px-8 sm:px-12 rounded-full text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                AGENDE AGORA
              </Link>
            </div>
          </div>
        </div>
        {/* Make bounce arrow responsive and only visible on larger screens */}
        <div className="absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2 text-white">
          <div className="animate-bounce">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section - Improved grid spacing */}
      <section
        ref={featuresRef}
        data-section="features"
        className="container mx-auto px-4 py-10 sm:py-12 md:py-16"
      >
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            <span className="text-amber-500">POR QUE</span> NOS ESCOLHER?
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-amber-500 mx-auto mt-3 sm:mt-4"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
          <div
            className={`text-center p-4 sm:p-6 rounded-lg space-y-3 sm:space-y-4 transition-all duration-1000 transform ${
              isVisible.features
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
            style={{ transitionDelay: "100ms" }}
          >
            <div className="bg-amber-500 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">
              Profissionais Experientes
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Nossa equipe possui anos de experiência em cortes modernos e
              clássicos, sempre atualizados com as tendências.
            </p>
          </div>

          <div
            className={`text-center p-4 sm:p-6 rounded-lg space-y-3 sm:space-y-4 transition-all duration-1000 transform ${
              isVisible.features
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="bg-amber-500 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">
              Ambiente Acolhedor
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Um espaço pensado para seu conforto e bem-estar, com música boa e
              bebidas para tornar sua experiência única.
            </p>
          </div>

          <div
            className={`text-center p-4 sm:p-6 rounded-lg space-y-3 sm:space-y-4 transition-all duration-1000 transform ${
              isVisible.features
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <div className="bg-amber-500 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">Produtos Premium</h3>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Utilizamos apenas os melhores produtos do mercado, garantindo
              qualidade e resultados excepcionais em cada serviço.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section - Improved card layout for mobile */}
      <section
        ref={servicesRef}
        data-section="services"
        className="py-12 sm:py-16 md:py-24 bg-zinc-900 text-white"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              NOSSOS <span className="text-amber-500">SERVIÇOS</span>
            </h2>
            <div className="w-16 sm:w-20 h-1 bg-amber-500 mx-auto mt-3 sm:mt-4"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {services.map((service, index) => (
              <div
                key={service.name}
                className={`bg-zinc-800 rounded-lg overflow-hidden shadow-lg transition-all duration-1000 transform ${
                  isVisible.services
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="h-40 sm:h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-wrap justify-between items-center mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold">
                      {service.name}
                    </h3>
                    <span className="text-amber-500 font-bold text-base sm:text-lg">
                      {service.price}
                    </span>
                  </div>
                  {/* Truncate long descriptions on smaller screens */}
                  <p className="text-gray-400 mb-4 text-sm sm:text-base line-clamp-3 sm:line-clamp-4">
                    {service.description}
                  </p>
                  <Link
                    to="/book"
                    className="inline-block bg-amber-500 text-black hover:bg-amber-600 font-semibold py-2 px-4 rounded transition-colors duration-300 w-full text-center text-sm sm:text-base"
                  >
                    Agendar
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-12">
            <Link
              to="/services"
              className="inline-block border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 text-sm sm:text-base"
            >
              VER TODOS OS SERVIÇOS
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Improved for mobile */}
      <section
        ref={testimonialsRef}
        data-section="testimonials"
        className="py-12 sm:py-16 md:py-24 bg-white text-black"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              O QUE NOSSOS <span className="text-amber-500">CLIENTES</span>{" "}
              DIZEM
            </h2>
            <div className="w-16 sm:w-20 h-1 bg-amber-500 mx-auto mt-3 sm:mt-4"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.name}
                className={`bg-gray-100 p-6 sm:p-8 rounded-lg relative transition-all duration-1000 transform ${
                  isVisible.testimonials
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="absolute -top-5 left-8">
                  <svg
                    className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500 opacity-50"
                    fill="currentColor"
                    viewBox="0 0 32 32"
                  >
                    <path d="M10 8v6a6 6 0 01-6 6H2v4h4a10 10 0 0010-10V8h-6zm18 0v6a6 6 0 01-6 6h-2v4h4a10 10 0 0010-10V8h-6z" />
                  </svg>
                </div>
                <p className="mb-4 text-gray-600 italic text-sm sm:text-base">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-500 text-sm sm:text-base">
                    {testimonial.name}
                  </span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          i < testimonial.rating
                            ? "text-amber-500"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - More compact on mobile */}
      <section className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg sm:rounded-xl p-6 sm:p-8 md:p-12 text-center shadow-xl">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-3 sm:mb-4 md:mb-6">
            PRONTO PARA UMA TRANSFORMAÇÃO?
          </h2>
          <p className="text-white text-sm sm:text-base md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto">
            Agende seu horário agora e experimente o melhor serviço de barbearia
            da cidade. Nossos profissionais estão prontos para atender você!
          </p>
          <Link
            to="/book"
            className="inline-block bg-zinc-900 text-white hover:bg-black font-bold py-3 sm:py-4 px-8 sm:px-12 rounded-full text-sm sm:text-lg transition-all duration-300 transform hover:scale-105"
          >
            AGENDE SEU HORÁRIO
          </Link>
        </div>
      </section>
    </div>
  );
}
