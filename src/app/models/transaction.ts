export interface TransactionItemRequest {
    productId: string;
    quantity: number;
}

export interface TransactionRequest {
    sellerId: string;
    customerId: string;

    items: TransactionItemRequest[]; 
}

export interface TransactionItemResponse {
    itemId: string;
    productId: string;
    quantity: number;
    subtotalPrice: number;
}

export interface SaleTransactionResponse {
    transactionId: string;
    saleDate: string; 
    sellerId: string;
    customerId: string;
    totalPrice: number;
    items: TransactionItemResponse[]; 
}