import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";

import { styles } from "../styles";
import { profile } from "../constants";
import { SectionWrapper } from "../hoc";
import { slideIn } from "../utils/motion";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_APP_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const initialForm = { name: "", email: "", message: "" };

const validate = ({ name, email, message }) => {
  if (!name.trim()) return "Please tell me your name.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Please enter a valid email address.";
  if (message.trim().length < 10) return "Your message should be at least 10 characters.";
  return null;
};

const Contact = () => {
  const formRef = useRef();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  // { type: "success" | "error", text: string } | null
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
    setStatus(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationError = validate(form);
    if (validationError) {
      setStatus({ type: "error", text: validationError });
      return;
    }

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.error(
        "EmailJS is not configured. Copy .env.example to .env and fill in your keys."
      );
      setStatus({
        type: "error",
        text: `The contact form isn't configured yet. Please email me directly at ${profile.email}.`,
      });
      return;
    }

    setLoading(true);

    emailjs
      .send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          // {{name}}, {{email}}, {{time}} match EmailJS's default
          // "Contact Us" template; the from_/to_ names suit custom ones.
          name: form.name.trim(),
          email: form.email.trim(),
          time: new Date().toLocaleString(),
          from_name: form.name.trim(),
          from_email: form.email.trim(),
          to_name: profile.name,
          to_email: profile.email,
          message: form.message.trim(),
        },
        EMAILJS_PUBLIC_KEY
      )
      .then(
        () => {
          setLoading(false);
          setStatus({
            type: "success",
            text: "Thank you. I will get back to you as soon as possible.",
          });
          setForm(initialForm);
        },
        (error) => {
          setLoading(false);
          console.error(error);
          setStatus({
            type: "error",
            text: "Ahh, something went wrong. Please try again.",
          });
        }
      );
  };

  return (
    <div className='mt-4 overflow-hidden'>
      <motion.div
        variants={slideIn("left", "tween", 0.2, 1)}
        className='max-w-3xl mx-auto bg-black-100 p-6 sm:p-8 rounded-2xl'
      >
        <p className={styles.sectionSubText}>Get in touch</p>
        <h3 className='text-white font-black text-[32px] sm:text-[40px] leading-tight'>Contact.</h3>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className='mt-6 flex flex-col gap-5'
        >
          {/* Name and email side by side on wider screens to save height. */}
          <div className='grid gap-5 sm:grid-cols-2'>
            <label className='flex flex-col'>
              <span className='text-white text-[14px] font-medium mb-2'>Your Name</span>
              <input
                type='text'
                name='name'
                value={form.name}
                onChange={handleChange}
                placeholder="What's your good name?"
                className='bg-tertiary py-3 px-4 text-[15px] placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium focus:ring-2 focus:ring-[#915EFF] transition-shadow'
              />
            </label>
            <label className='flex flex-col'>
              <span className='text-white text-[14px] font-medium mb-2'>Your email</span>
              <input
                type='email'
                name='email'
                value={form.email}
                onChange={handleChange}
                placeholder="What's your web address?"
                className='bg-tertiary py-3 px-4 text-[15px] placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium focus:ring-2 focus:ring-[#915EFF] transition-shadow'
              />
            </label>
          </div>
          <label className='flex flex-col'>
            <span className='text-white text-[14px] font-medium mb-2'>Your Message</span>
            <textarea
              rows={4}
              name='message'
              value={form.message}
              onChange={handleChange}
              placeholder='What you want to say?'
              className='bg-tertiary py-3 px-4 text-[15px] placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium focus:ring-2 focus:ring-[#915EFF] transition-shadow'
            />
          </label>

          {status && (
            <p
              role={status.type === "error" ? "alert" : "status"}
              className={`text-[15px] font-medium ${
                status.type === "error" ? "text-[#fc6767]" : "text-[#38ef7d]"
              }`}
            >
              {status.text}
            </p>
          )}

          <button
            type='submit'
            disabled={loading}
            className='bg-tertiary py-3 px-8 rounded-xl outline-none w-fit text-white font-bold shadow-md shadow-primary transition-all hover:bg-[#915EFF] hover:shadow-[0_0_25px_#915EFF80] disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default SectionWrapper(Contact, "contact");
