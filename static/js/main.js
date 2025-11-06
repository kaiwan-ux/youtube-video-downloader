// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Check for saved theme preference or default to dark mode
const currentTheme = localStorage.getItem('theme') || 'dark';
html.classList.toggle('dark', currentTheme === 'dark');

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const theme = html.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// Particles Background
function initParticles() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const particlesBg = document.getElementById('particles-bg');
    
    if (!particlesBg) return;
    
    particlesBg.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 50;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.fillStyle = `rgba(0, 240, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Connect nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.strokeStyle = `rgba(176, 38, 255, ${0.1 * (1 - distance / 100)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// 3D Logo Effect
function initLogo3D() {
    const logo = document.querySelector('.logo-3d');
    if (!logo) return;
    
    logo.addEventListener('mousemove', (e) => {
        const rect = logo.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        logo.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });
    
    logo.addEventListener('mouseleave', () => {
        logo.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
}

// GSAP Animations
document.addEventListener('DOMContentLoaded', () => {
    // Ensure all glass cards are visible first
    const glassCards = document.querySelectorAll('.glass-card');
    glassCards.forEach(card => {
        card.style.opacity = '1';
        card.style.visibility = 'visible';
    });
    
    // Animate elements on load (only if GSAP is available)
    if (typeof gsap !== 'undefined') {
        gsap.from('.glass-card', {
            duration: 0.8,
            y: 30,
            opacity: 0,
            stagger: 0.1,
            ease: 'power2.out',
            onComplete: function() {
                // Ensure visibility after animation
                glassCards.forEach(card => {
                    card.style.opacity = '1';
                    card.style.visibility = 'visible';
                });
            }
        });
        
        // Animate input container (only on homepage)
        const inputContainer = document.getElementById('input-container');
        if (inputContainer) {
            gsap.to(inputContainer, {
                duration: 2,
                y: -10,
                yoyo: true,
                repeat: -1,
                ease: 'power1.inOut'
            });
        }
        
        // Animate convert button (only on homepage)
        const convertBtn = document.getElementById('convert-btn');
        if (convertBtn) {
            gsap.to(convertBtn, {
                duration: 1.5,
                scale: 1.05,
                yoyo: true,
                repeat: -1,
                ease: 'power1.inOut'
            });
        }
    }
    
    initParticles();
    initLogo3D();
});

