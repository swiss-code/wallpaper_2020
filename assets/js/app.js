---
---
// add file size validator
$.validator.addMethod('fileSize', function(value, element, sizeLimit) {
    console.log()
    if (typeof element.files == 'undefined' || element.files.length == 0) {
        // no files  to check
        return true;
    }
    result = true;
    $.each(element.files, function(i, file) {
        mbSize = ((file.size / 1024) / 1024).toFixed(4); // MB
        if (mbSize >= sizeLimit) {
            result = false;
            return false; // break out of each loop
        }
    });
    return result;
}, 'Any file needs to be less than {0}MB');
// limit number of files
$.validator.addMethod("fileCount", function(value, element, fileCount) {
    return this.optional(element) || (element.files.length <= fileCount)
}, "Only {0} files can be uploaded.");
// specify message for validating email, phone
$.validator.addMethod("phoneCheck", function(phone_number, element) {
    phone_number = phone_number.replace(/\s+/g, "");
    return this.optional(element) || phone_number.length > 8 &&
        phone_number.match(/^(\+)?[0-9\-]+$/);
}, "Please specify a valid phone number");
//
emailOrPhone = "Email or phone is required.";
// send json form
$("#contactForm").validate({
    ignore: ".ignore",
    rules: {
        name: {
          required: true
        },
        email: {
            required: function(element) {
                return (!$("#phone").hasClass("valid"));
            }
        },
        phone: {
            required: function(element) {
                return (!$("#email").hasClass("valid"));
            },
            phoneCheck: true,
        },
        message: {
            required: true,
            minlength: 20,
        },
        attachment: {
            required: false,
            fileSize: 2, // file size in MB
            fileCount: 10,
        },
        hiddenReCaptcha: {
            required: function() {
                return grecaptcha.getResponse() === "";
            }
        }
    },
    messages: {
        email: {
            required: emailOrPhone,
        },
        phone: {
            required: emailOrPhone,
        }
    },
    submitHandler: function(form) {
        console.log("Form submitting...");
        const fallbackEmailEncode = '{{ site.email_encode }}';
        const fallbackSubject = escape('Tell us a overview message');

        const formEl = $("#contactForm")
        const formJson = getFormData(formEl);
        const formData = new FormData();
        const meta = JSON.stringify(formJson);
        // send form fields in meta element
        formData.append("meta", meta);
        $.each($('#attachment')[0].files, function(i, file) {
            formData.append('file-' + i, file);
        });
        $.ajax({
            type: "POST",
            url: "{{ site.form_url }}",
            data: formData,
            contentType: false,
            processData: false,
            crossDomain: true,
            beforeSend: function(xhr) {
              xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
              $('.spinner').removeClass('hidden');
            },
            success: function(result) {
                console.log(result);

                $('.contact__form').remove();
                $('.contact__error').remove();
                $('.contact__thank-you').removeClass('hidden');
                $('.contact-thank-you__message>h1').text(formJson.message);
            },
            error: function(xhr, response, text) {
                console.log(xhr, response, text);

                const body = escape(formJson.message);
                $('.contact__form').remove();
                $('.contact__thank-you').remove();
                $('.contact__error').removeClass('hidden');
                $('.contact__error .email').attr('href', 'mailto: ' + window.atob(fallbackEmailEncode) + '?subject=' + fallbackSubject + '&body=' + body);
            },
            complete: function() {
                $('.spinner').addClass('hidden');
            }
        });
    }
});

// transform array to json
// based on https://stackoverflow.com/a/11339012
function getFormData($form) {
  const unindexedArray = $form.serializeArray();
  const indexedArray = {};

  $.map(unindexedArray, function(element, _) {
      indexedArray[element['name']] = element['value'];
  });

  return indexedArray;
}

/**
 * This will be call when user passes challenge
 */
function onReCaptchaOK() {
    $('#hiddenReCaptcha').valid();
};
