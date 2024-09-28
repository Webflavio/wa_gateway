document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            console.log('Form data:', data);
            // Here you would typically send the data to your server
            alert('تم إرسال البيانات بنجاح!');
            form.reset();
        });
    });

    // Add a back to home button on pages other than index
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        const header = document.querySelector('header');
        const backButton = document.createElement('a');
        backButton.href = '/';
        backButton.className = 'btn';
        backButton.innerHTML = '<i class="fas fa-home mr-2"></i>العودة للرئيسية';
        header.querySelector('.max-w-7xl').appendChild(backButton);
    }
});