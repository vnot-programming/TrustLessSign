<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadSignatureRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'signature_image' => 'required|image|mimes:png,jpg,jpeg,webp|max:5120', // 5MB max
            'signature_name' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'signature_image.required' => 'An image file is required.',
            'signature_image.image' => 'The file must be a valid image.',
            'signature_image.mimes' => 'The image must be a file of type: png, jpg, jpeg, webp.',
            'signature_image.max' => 'The image size must not exceed 5MB.',
        ];
    }
}


    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            //
        ];
    }
}
