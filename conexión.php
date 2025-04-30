<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $to_owner = "tu-email@tudominio.com";
  $to_customer = $_POST['email'];
  
  // Email para el cliente
  $subject_customer = "Confirmación de compra";
  $message_customer = "Gracias por tu compra..."; // Personaliza este mensaje
  $headers_customer = "From: $to_owner\r\nContent-type: text/html";
  
  // Email para el dueño
  $subject_owner = "Nueva compra recibida";
  $message_owner = "Detalles de la compra..."; // Personaliza este mensaje
  $headers_owner = "From: $to_customer\r\nContent-type: text/html";
  
  // Enviar emails
  mail($to_customer, $subject_customer, $message_customer, $headers_customer);
  mail($to_owner, $subject_owner, $message_owner, $headers_owner);
  
  echo json_encode(["success" => true]);
}
?>