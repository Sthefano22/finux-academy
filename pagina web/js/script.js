// ==============================================
// FUNCIONES GENERALES
// ==============================================

/**
 * Incluye componentes HTML (header, footer, etc.)
 */
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

/**
 * Inicializa componentes de Bootstrap (tooltips, popovers, etc.)
 */
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

/**
 * Muestra un mensaje de alerta en pantalla
 */
function showMessage(type, message) {
    const alertContainer = document.createElement("div");
    alertContainer.className = `alert alert-${type} mt-3`;
    alertContainer.textContent = message;

    const mainContainer = document.querySelector("body");
    mainContainer.prepend(alertContainer);

    setTimeout(() => alertContainer.remove(), 5000);
}

/**
 * Cambia el estado de un botón (deshabilitar, spinner, restaurar texto)
 */
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
// VALIDACIONES
// ==============================================

/**
 * Valida los datos del formulario de pago
 */
function validateForm() {
    const form = document.getElementById('checkoutForm');
    if (form.checkValidity()) {
        // Mostrar el modal si el formulario es válido
        const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
        modal.show();
    } else {
        // Si no es válido, mostrar errores
        form.classList.add('was-validated');
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
    const receiptForm = document.getElementById('receiptForm');
    if (receiptForm.checkValidity()) {
        alert("¡Comprobante enviado con éxito!");
        // Aquí puedes manejar el envío real a un servidor si lo deseas
    } else {
        receiptForm.classList.add('was-validated');
    }
}

// ==============================================
// SISTEMA DE PAGOS
// ==============================================

/**
 * Procesa el pago de forma segura
 */
async function processPayment() {
    try {
        // Capturar datos del formulario
        const formData = {
            firstName: document.getElementById("firstName").value.trim(),
            lastName: document.getElementById("lastName").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            university: document.getElementById("university").value.trim(),
            course: document.getElementById("course").value.trim(),
            packageName: document.getElementById("packageName").textContent.trim(),
            priceDisplay: document.getElementById("totalPrice").textContent.trim(),
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value,
        };

        // Convertir y validar el precio
        formData.amount = parseFloat(formData.priceDisplay.replace(/[^\d.]/g, ""));
        const errors = validatePaymentForm(formData);

        if (errors.length > 0) {
            throw new Error(errors.join("\n"));
        }

        // Mostrar estado de carga
        const submitBtn = document.querySelector('#checkoutForm button[type="submit"]');
        toggleButtonState(submitBtn, true, "Procesando pago...");

        // Enviar datos al servidor
        const response = await fetch(`${API_BASE_URL}/pagos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${AUTH_TOKEN}`,
            },
            body: JSON.stringify({
                customer: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                },
                order: {
                    university: formData.university,
                    course: formData.course,
                    package: formData.packageName,
                    amount: formData.amount,
                    currency: "PEN",
                },
                paymentMethod: formData.paymentMethod,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error en el servidor.");
        }

        const result = await response.json();
        showMessage("success", `¡Pago exitoso! ID de transacción: ${result.transactionId}`);
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
// INICIALIZACIÓN
// ==============================================

document.addEventListener("DOMContentLoaded", function () {
    // Incluir componentes HTML
    includeHTML();

    // Inicializar componentes de Bootstrap
    initBootstrapComponents();

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