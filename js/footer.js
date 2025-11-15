// Reusable footer component
document.addEventListener('DOMContentLoaded', function() {
    // Create footer element
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-logos">
                <img src="images/logo.png" alt="Logo 1" class="footer-logo">
                <img src="images/logo2.png" alt="Logo 2" class="footer-logo">
            </div>
            <div class="footer-links">
                <a href="about.html">فريق المطورين</a>
            </div>
            <div class="copyright">
                &copy; 2025 جميع الحقوق محفوظة لثانوية رفيق الحريري.
            </div>
        </div>
    `;
    
    // Add footer to the end of the body
    document.body.appendChild(footer);
});