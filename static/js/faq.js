document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');
    
    // Ensure FAQ items are visible
    faqItems.forEach(item => {
        item.style.opacity = '1';
        item.style.visibility = 'visible';
    });
    
    faqItems.forEach(item => {
        const button = item.querySelector('.faq-button');
        const content = item.querySelector('.faq-content');
        
        if (button && content) {
            button.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all items
                faqItems.forEach(faqItem => {
                    faqItem.classList.remove('active');
                    const faqContent = faqItem.querySelector('.faq-content');
                    if (faqContent) {
                        faqContent.classList.add('hidden');
                    }
                });
                
                // Open clicked item if it wasn't active
                if (!isActive) {
                    item.classList.add('active');
                    content.classList.remove('hidden');
                }
            });
        }
    });
    
    // Animate FAQ items on load (only if GSAP is available)
    if (typeof gsap !== 'undefined') {
        gsap.from('.faq-item', {
            duration: 0.5,
            x: -30,
            opacity: 0,
            stagger: 0.1,
            ease: 'power2.out',
            onComplete: function() {
                faqItems.forEach(item => {
                    item.style.opacity = '1';
                    item.style.visibility = 'visible';
                });
            }
        });
    }
});

