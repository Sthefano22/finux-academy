// ==============================================
// FUNCIONES GENERALES
// ==============================================

/* Incluye componentes HTML dinámicamente */
function includeHTML() {
    const includes = document.querySelectorAll("[data-include]");
    includes.forEach((element) => {
        const file = `assets/${element.getAttribute("data-include")}.html`;

        fetch(file)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Error al cargar ${file}: ${response.status}`);
                }
                return response.text();
            })
            .then((html) => {
                element.innerHTML = html;
                element.removeAttribute("data-include");
                includeHTML(); 
            })
            .catch((error) => {
                console.error("Error al cargar componente:", error);
                element.innerHTML = `<div class="alert alert-danger">Error al cargar componente</div>`;
            });
    });
}

/* Inicializa componentes de Bootstrap */
function initBootstrapComponents() {
    // Tooltips
    const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );

    // Popovers
    const popoverTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="popover"]')
    );
    popoverTriggerList.map(
        (popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl)
    );
}

/* Muestra un mensaje de alerta */
function showMessage(type, message) {
    const alertContainer = document.createElement("div");
    alertContainer.className = `alert alert-${type} alert-dismissible fade show mt-3 text-center`;
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>`;

    const mainContainer = document.querySelector("body");
    mainContainer.prepend(alertContainer);

    setTimeout(() => {
        if (alertContainer) alertContainer.remove();
    }, 5000);
}

/* Cambia el estado del botón (cargando o normal) */
function toggleButtonState(button, isLoading, loadingText = "Procesando...") {
    if (!button) return;

    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> ${loadingText}`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.textContent;
    }
}

// ==============================================
// VALIDACIÓN PERSONALIZADA
// ==============================================

/* Configura validaciones personalizadas */
function setupCustomValidation() {
    const validationMessages = {
        firstName: "Por favor ingresa tus nombres",
        lastName: "Por favor ingresa tus apellidos",
        email: "Por favor ingresa un correo válido",
        phone: "Por favor ingresa tu número telefónico",
        university: "Por favor selecciona tu universidad/instituto",
        subject: "Por favor selecciona un curso",
        receiptFile: "Por favor sube tu comprobante de pago",
        paymentMethod: "Por favor selecciona un método de pago",
        default: "Por favor completa este campo",
    };

    document.querySelectorAll("[required]").forEach((element) => {
        element.addEventListener("invalid", function (e) {
            e.preventDefault();
            if (!element.classList.contains("is-invalid")) {
                const message =
                    validationMessages[element.id] ||
                    validationMessages[element.name] ||
                    validationMessages.default;
                element.setCustomValidity(message);

                const feedbackElement = element.nextElementSibling;
                if (feedbackElement && feedbackElement.classList.contains("invalid-feedback")) {
                    feedbackElement.textContent = message;
                }

                element.classList.add("is-invalid");
                element.reportValidity();
            }
        });

        element.addEventListener("input", function () {
            element.setCustomValidity("");
            element.classList.remove("is-invalid");
        });
    });
}

// ==============================================
// FUNCIONES PARA EL FORMULARIO DE PAGO
// ==============================================

/* Maneja el método de pago Yape */
function setupPaymentMethodToggle() {
    const yapeRadio = document.getElementById("yapeMethod");
    const yapeDetails = document.getElementById("yapeDetails");

    if (!yapeRadio || !yapeDetails) return;

    document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
        radio.addEventListener("change", function () {
            yapeDetails.style.display = yapeRadio.checked ? "block" : "none";
        });
    });
}

// Copia los datos del formulario principal al del comprobante
function copyCheckoutDataToReceiptForm() {
    const checkoutForm = document.getElementById("checkoutForm");
    const receiptForm = document.getElementById("receiptForm");
    if (!checkoutForm || !receiptForm) return;

    const fields = [
        "firstName", "lastName", "email", "phone", "university", "subject", "package", "amount", "paymentMethod"
    ];
    fields.forEach(field => {
        let value = checkoutForm.querySelector(`[name="${field}"]`)?.value || "";
        let hidden = receiptForm.querySelector(`[name="${field}"]`);
        if (!hidden) {
            hidden = document.createElement("input");
            hidden.type = "hidden";
            hidden.name = field;
            receiptForm.appendChild(hidden);
        }
        hidden.value = value;
    });
}

/* Prepara y envía todos los datos del formulario */
async function submitAllData(event) {
    event.preventDefault();

    const form = document.getElementById("checkoutForm");
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        showMessage("danger", "Por favor completa todos los campos obligatorios.");
        return;
    }

    toggleButtonState(submitBtn, true, "Enviando...");
    try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        if (result.success) {
            showMessage("success", "¡Pago registrado correctamente!");
            bootstrap.Modal.getInstance(document.getElementById("receiptModal")).hide();
            form.reset();
            form.classList.remove("was-validated");

            setTimeout(() => {
                window.location.href = "gracias.html";
            }, 2000);
        } else {
            showMessage("danger", result.message || "Error al procesar el pago");
        }
    } catch (error) {
        console.error("Error:", error);
        showMessage("danger", "Error al enviar los datos. Por favor intenta nuevamente.");
    } finally {
        toggleButtonState(submitBtn, false);
    }
}

// ==============================================
// RESUMEN DE COMPRA
// ==============================================

/* Obtiene parámetros de la URL */
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        package: params.get("package"),
        price: params.get("price"),
        regular: params.get("regular"),
        discount: params.get("discount"),
    };
}

function formatPackageName(packageName) {
    const packageMap = {
        "individual": "Asesoría Individual",
        "grupo_3": "Paquete Grupal (3 sesiones)",
        "grupo_5": "Paquete Grupal (5 sesiones)",
        "premium": "Paquete Premium",
        "basico": "Paquete Básico",
        "avanzado": "Paquete Avanzado"
    };

    return packageMap[packageName] || 
           packageName.replace(/_/g, " ")
                     .split(" ")
                     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                     .join(" ");
}

/* Actualiza el resumen con los parámetros de la URL */
function updateSummaryFromParams() {
    const { package, price, regular, discount } = getQueryParams();

    if (!package || !price) {
        showMessage("danger", "Por favor selecciona un paquete antes de continuar.");
        setTimeout(() => {
            window.location.href = "packages.html";
        }, 2000);
        return;
    }

    // Formatear valores
    const formattedPackage = formatPackageName(package);
    const formattedPrice = parseFloat(price).toFixed(2);
    const formattedRegular = parseFloat(regular || price).toFixed(2);
    const formattedDiscount = discount ? parseFloat(discount).toFixed(2) : "0.00";

    // Actualizar elementos del resumen
    const elementsToUpdate = {
        "packageName": formattedPackage,
        "regularPrice": `S/${formattedRegular}`,
        "discount": discount ? `-S/${formattedDiscount}` : "S/0.00",
        "finalPrice": `S/${formattedPrice}`,
        "totalPrice": `S/${formattedPrice}`,
        "yapePaquete": formattedPackage,
        "yapeMonto": formattedPrice
    };

    Object.entries(elementsToUpdate).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    // Actualizar campos ocultos
    const hiddenPackage = document.getElementById("hiddenPackage");
    const hiddenAmount = document.getElementById("hiddenAmount");
    if (hiddenPackage) hiddenPackage.value = package;
    if (hiddenAmount) hiddenAmount.value = price;
}

// ==============================================
// INICIALIZACIÓN
// ==============================================

document.addEventListener("DOMContentLoaded", function () {
    includeHTML();
    initBootstrapComponents();
    setupCustomValidation();
    setupPaymentMethodToggle();

    if (window.location.pathname.includes("checkout.html")) {
        updateSummaryFromParams();
    }

    const receiptForm = document.getElementById("receiptForm");
    if (receiptForm) {
        receiptForm.addEventListener("submit", submitAllData);
    }
});
