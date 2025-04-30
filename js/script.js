// ==============================================
// FUNCIONES GENERALES
// ==============================================

/* Incluye componentes HTML (header, footer, etc.) */
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
                includeHTML(); // Procesar includes anidados
            })
            .catch((error) => {
                console.error("Error al cargar componente:", error);
                element.innerHTML = `<div class="alert alert-danger">Error al cargar componente</div>`;
            });
    });
}

/* Inicializa componentes de Bootstrap (tooltips, popovers, etc.) */
function initBootstrapComponents() {
    const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );

    const popoverTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="popover"]')
    );
    popoverTriggerList.map(
        (popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl)
    );
}

/* Muestra un mensaje de alerta en pantalla */
function showMessage(type, message) {
    const alertContainer = document.createElement("div");
    alertContainer.className = `alert alert-${type} mt-3`;
    alertContainer.textContent = message;

    const mainContainer = document.querySelector("body");
    mainContainer.prepend(alertContainer);

    setTimeout(() => alertContainer.remove(), 5000);
}

/* Cambia el estado de un botón (deshabilitar, spinner, restaurar texto) */
function toggleButtonState(button, isLoading, loadingText = "Procesando...") {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> ${loadingText}`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || "Enviar";
    }
}

// ==============================================
// FUNCIONES PARA EL FORMULARIO DE PAGO
// ==============================================

/* Valida los datos del formulario de pago */
function validateForm() {
    const form = document.getElementById("checkoutForm");
    if (form.checkValidity()) {
        // Mostrar el modal si el formulario es válido
        const modal = new bootstrap.Modal(document.getElementById("receiptModal"));
        modal.show();
    } else {
        // Si no es válido, mostrar errores
        form.classList.add("was-validated");
    }
}

// Mostrar detalles de Yape al seleccionar ese método
document.addEventListener('DOMContentLoaded', function () {
    const yapeRadio = document.getElementById('yapeMethod');
    const yapeDetails = document.getElementById('yapeDetails');

    yapeRadio.addEventListener('change', function () {
        if (this.checked) {
            yapeDetails.style.display = 'block';
        }
    });
});

function submitPayment() {
    // Validar el formulario del comprobante
    const receiptForm = document.getElementById("receiptForm");
    if (!receiptForm.checkValidity()) {
        receiptForm.classList.add("was-validated");
        return;
    }

    // Simular el envío del comprobante (puedes reemplazar esto con una llamada al servidor)
    alert("Comprobante enviado con éxito.");

    // Cerrar el modal
    const receiptModal = bootstrap.Modal.getInstance(document.getElementById("receiptModal"));
    receiptModal.hide();

    // Reiniciar el formulario del comprobante
    receiptForm.reset();
    receiptForm.classList.remove("was-validated");
}

// ==============================================
// SISTEMA DE PAGOS
// ==============================================

/* Procesa el pago de forma segura */
async function processPayment() {
    try {
        // Capturar datos del formulario
        const formData = {
            firstName: document.getElementById("firstName").value.trim(),
            lastName: document.getElementById("lastName").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            packageName: document.getElementById("packageName").textContent.trim(),
            priceDisplay: document.getElementById("totalPrice").textContent.trim(),
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value,
        };

        // Convertir y validar el precio
        formData.amount = parseFloat(formData.priceDisplay.replace(/[^\d.]/g, ""));
        if (isNaN(formData.amount) || formData.amount <= 0) {
            throw new Error("El monto total no es válido.");
        }

        // Mostrar estado de carga
        const submitBtn = document.querySelector('#checkoutForm button[type="submit"]');
        toggleButtonState(submitBtn, true, "Procesando pago...");

        // Simular envío al servidor (puedes reemplazar esto con una llamada real)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Mostrar mensaje de éxito
        showMessage("success", "¡Pago procesado con éxito!");
        document.getElementById("checkoutForm").reset();
    } catch (error) {
        console.error("Error en el pago:", error);
        showMessage("danger", `Error al procesar el pago: ${error.message}`);
    } finally {
        const submitBtn = document.querySelector('#checkoutForm button[type="submit"]');
        if (submitBtn) toggleButtonState(submitBtn, false);
    }
}

// ==============================================
// FUNCIONES PARA EL RESUMEN DE COMPRA
// ==============================================

// Función para obtener parámetros de la URL
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        package: params.get("package"),
        price: params.get("price"),
        regular: params.get("regular"),
        discount: params.get("discount"),
    };
}

// Función para actualizar el resumen de compra
function updateSummaryFromParams() {
    const { package, price, regular, discount } = getQueryParams();

    // Validar que todos los parámetros estén presentes
    if (!package || !price || !regular || !discount) {
        alert("Por favor selecciona un paquete antes de continuar.");
        window.location.href = "packages.html"; // Redirige a la página de paquetes si faltan parámetros
        return;
    }

    // Actualizar los valores en el resumen de compra
    document.getElementById("packageName").textContent = package.replace(/_/g, " ").toUpperCase();
    document.getElementById("regularPrice").textContent = `S/${parseFloat(regular).toFixed(2)}`;
    document.getElementById("discount").textContent = `-S/${parseFloat(discount).toFixed(2)}`;
    document.getElementById("finalPrice").textContent = `S/${parseFloat(price).toFixed(2)}`;
    document.getElementById("totalPrice").textContent = `S/${parseFloat(price).toFixed(2)}`;
}

// ==============================================
// INICIALIZACIÓN
// ==============================================

document.addEventListener("DOMContentLoaded", function () {
    // Incluir componentes HTML
    includeHTML();

    // Inicializar componentes de Bootstrap
    initBootstrapComponents();

    // Verificar si estamos en la página de checkout antes de actualizar el resumen
    if (window.location.pathname.includes("checkout.html")) {
        // Actualizar el resumen de compra desde los parámetros de la URL
        updateSummaryFromParams();
    }

    // Configurar formulario de pago
    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", function (e) {
            e.preventDefault();
            processPayment();
        });
    }

    // Configurar selección de método de pago
    document.querySelectorAll(".payment-method").forEach((method) => {
        method.addEventListener("click", function () {
            document.querySelectorAll(".payment-method").forEach((m) => m.classList.remove("active"));
            this.classList.add("active");
        });
    });
});