export const SavedPaymentMethod: React.FC<{
  method: SavedPaymentMethod;
  onRemove: () => void;
}> = ({ method, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove();
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
      <div className="flex items-center space-x-4">
        <PaymentMethodIcon type={method.type} />
        <div>
          <p className="font-medium text-white">
            {method.type === 'card' ? `•••• ${method.last4}` : method.email}
          </p>
          <p className="text-sm text-gray-400">
            {method.type === 'card' 
              ? `Expires ${method.expiryMonth}/${method.expiryYear}`
              : 'PayPal Account'}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        disabled={isRemoving}
      >
        {isRemoving ? <Spinner className="w-4 h-4" /> : <Trash className="w-4 h-4" />}
      </Button>
    </div>
  );
}; 