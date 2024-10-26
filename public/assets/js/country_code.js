document.addEventListener("DOMContentLoaded", function() {
      var input = document.querySelector("#phone");
      var iti = window.intlTelInput(input, {
         preferredCountries: ["ca", "cad"], // Customize based on your needs
         separateDialCode: true,
         utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.min.js", // Utility script
      });

      // Update hidden input field with full phone number
      input.addEventListener("input", function() {
         var fullPhoneNumber = iti.getNumber();
         var countryCode =   '+'+iti.getSelectedCountryData().dialCode;

      
         document.querySelector("#fullPhoneNumber").value = fullPhoneNumber;
         document.querySelector("#countryCode").value = countryCode;

      });

      // Initialize hidden field with the current value on page load
      var fullPhoneNumber = iti.getNumber();
      var countryCode =   '+'+iti.getSelectedCountryData().dialCode;
      document.querySelector("#fullPhoneNumber").value = fullPhoneNumber;
      document.querySelector("#countryCode").value = countryCode;
   });