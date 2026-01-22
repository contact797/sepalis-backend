// Inject font-face styles for vector icons on web
(function() {
  if (typeof document !== 'undefined') {
    var style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'ionicons';
        src: url('/fonts/Ionicons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'Material Icons';
        src: url('/fonts/MaterialIcons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'FontAwesome';
        src: url('/fonts/FontAwesome.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'Material Design Icons';
        src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    `;
    document.head.appendChild(style);
  }
})();
