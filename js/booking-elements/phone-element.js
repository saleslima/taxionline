/**
 * Phone-related element creation functions
 */
import { formatPhoneNumber } from "../utils.js";

// Create phone element with WhatsApp link
export function createPhoneElement(phone) {
    const pPhone = document.createElement('p');
    const rawPhoneNumber = String(phone).replace(/\D/g, '');
    const formattedPhone = formatPhoneNumber(phone);

    pPhone.textContent = `TELEFONE: ${formattedPhone.toUpperCase()}`;

    if (rawPhoneNumber.length >= 10) {
        const whatsappLink = document.createElement('a');
        whatsappLink.href = `https://wa.me/55${rawPhoneNumber}`;
        whatsappLink.target = '_blank';
        whatsappLink.classList.add('whatsapp-link');
        whatsappLink.setAttribute('aria-label', `Enviar mensagem para ${formattedPhone} no WhatsApp`);

        const icon = document.createElement('i');
        icon.classList.add('fab', 'fa-whatsapp');
        whatsappLink.appendChild(icon);

        pPhone.appendChild(whatsappLink);
    }

    return pPhone;
}