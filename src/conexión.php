<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';

header('Content-Type: application/json');

// Conexión a la base de datos
$host = 'localhost';
$dbname = 'finuxaca_pagos_db';
$username = 'finuxaca_usuario_db';
$password = 'Te@mo2488';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al conectar con la base de datos.'
    ]);
    error_log("Error de conexión a la base de datos: " . $e->getMessage());
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        // Validar campos obligatorios
        $requiredFields = [
            'firstName' => 'Nombres',
            'lastName' => 'Apellidos',
            'email' => 'Correo electrónico',
            'phone' => 'Teléfono',
            'subject' => 'Curso',
            'paymentMethod' => 'Método de pago',
            'package' => 'Paquete',
            'amount' => 'Monto'
        ];

        $missingFields = [];
        foreach ($requiredFields as $field => $name) {
            if (empty($_POST[$field])) {
                $missingFields[] = $name;
            }
        }

        if (!empty($missingFields)) {
            throw new Exception("Faltan los siguientes campos obligatorios: " . implode(', ', $missingFields));
        }

        // Validar formato de correo electrónico
        if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("El correo electrónico no es válido.");
        }

        // Validar archivo de comprobante
        if (empty($_FILES['receipt']['name'])) {
            throw new Exception("Por favor sube tu comprobante de pago.");
        }

        // Validar tipo de archivo
        $allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!in_array($_FILES['receipt']['type'], $allowedTypes)) {
            throw new Exception("Solo se permiten archivos JPG, PNG o PDF.");
        }

        // Validar tamaño del archivo (máximo 5MB)
        if ($_FILES['receipt']['size'] > 5 * 1024 * 1024) {
            throw new Exception("El archivo es demasiado grande. Máximo permitido: 5 MB.");
        }

        // Subir archivo comprobante
        $uploadDir = "comprobantes/";
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $receiptName = uniqid() . '_' . basename($_FILES["receipt"]["name"]);
        $receiptPath = $uploadDir . $receiptName;

        if (!move_uploaded_file($_FILES["receipt"]["tmp_name"], $receiptPath)) {
            throw new Exception("Error al subir el comprobante.");
        }

        // Guardar en la base de datos
        $stmt = $pdo->prepare("
            INSERT INTO payments (
                first_name, last_name, email, phone, university, subject, payment_method, package, amount, transaction_code, receipt_path
            ) VALUES (
                :first_name, :last_name, :email, :phone, :university, :subject, :payment_method, :package, :amount, :transaction_code, :receipt_path
            )
        ");
        $stmt->execute([
            ':first_name' => htmlspecialchars($_POST['firstName']),
            ':last_name' => htmlspecialchars($_POST['lastName']),
            ':email' => htmlspecialchars($_POST['email']),
            ':phone' => htmlspecialchars($_POST['phone']),
            ':university' => htmlspecialchars($_POST['university'] ?? null),
            ':subject' => htmlspecialchars($_POST['subject']),
            ':payment_method' => htmlspecialchars($_POST['paymentMethod']),
            ':package' => htmlspecialchars($_POST['package']),
            ':amount' => htmlspecialchars($_POST['amount']),
            ':transaction_code' => htmlspecialchars($_POST['transactionCode'] ?? null),
            ':receipt_path' => $receiptPath
        ]);

        // Enviar correo
        $mail = new PHPMailer(true);

        try {
            // Configuración del servidor SMTP
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = getenv('SMTP_USER') ?: 'finuxacademy@gmail.com'; // Usa variable de entorno
            $mail->Password = getenv('SMTP_PASS') ?: 'rappi2501'; // Usa variable de entorno
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;

            // Remitente y destinatario
            $mail->setFrom('finuxacademy@gmail.com', 'Finux Academy');
            $mail->addAddress('finuxacademy@gmail.com'); // Receptor interno
            $mail->addReplyTo($_POST['email'], $_POST['firstName'] . ' ' . $_POST['lastName']);

            // Adjuntar comprobante
            $mail->addAttachment($receiptPath);

            // Contenido del correo
            $mail->isHTML(true);
            $mail->Subject = 'Nuevo pago recibido: ' . $_POST['package'];
            $mail->Body = "
                <h2>Nuevo pago recibido</h2>
                <p><strong>Nombre:</strong> {$_POST['firstName']} {$_POST['lastName']}</p>
                <p><strong>Correo:</strong> {$_POST['email']}</p>
                <p><strong>Teléfono:</strong> {$_POST['phone']}</p>
                <p><strong>Universidad:</strong> {$_POST['university']}</p>
                <p><strong>Curso:</strong> {$_POST['subject']}</p>
                <p><strong>Método de Pago:</strong> {$_POST['paymentMethod']}</p>
                <p><strong>Paquete:</strong> {$_POST['package']}</p>
                <p><strong>Monto:</strong> S/. {$_POST['amount']}</p>
                <p><strong>Código de Transacción:</strong> {$_POST['transactionCode']}</p>
                <p><strong>Comprobante:</strong> $receiptName</p>
            ";

            $mail->send();

            echo json_encode([
                'success' => true,
                'message' => 'Pago registrado y correo enviado correctamente.'
            ]);
        } catch (Exception $e) {
            throw new Exception("El mensaje no pudo ser enviado. Error: {$mail->ErrorInfo}");
        }

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
}
?>