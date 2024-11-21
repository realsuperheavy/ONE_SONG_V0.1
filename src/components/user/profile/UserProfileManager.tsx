export const UserProfileManager: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile(user?.uid);
  const { savedMethods, addPaymentMethod, removePaymentMethod } = usePaymentMethods(user?.uid);
  const { elements, stripe } = useStripe();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Profile Section */}
      <Card className="bg-gray-800 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
          <Button
            variant="outline"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
          >
            {isEditingProfile ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {isEditingProfile ? (
          <ProfileEditForm
            profile={profile}
            onSave={updateProfile}
            onCancel={() => setIsEditingProfile(false)}
          />
        ) : (
          <ProfileDisplay profile={profile} />
        )}
      </Card>

      {/* Payment Methods Section */}
      <Card className="bg-gray-800 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Payment Methods</h2>
          <Button
            variant="outline"
            onClick={() => setIsAddingPayment(!isAddingPayment)}
          >
            {isAddingPayment ? 'Cancel' : 'Add Payment Method'}
          </Button>
        </div>

        {/* Saved Payment Methods */}
        <div className="space-y-4 mb-6">
          {savedMethods.map((method) => (
            <SavedPaymentMethod
              key={method.id}
              method={method}
              onRemove={() => removePaymentMethod(method.id)}
            />
          ))}

          {savedMethods.length === 0 && (
            <p className="text-gray-400 text-center py-4">
              No saved payment methods
            </p>
          )}
        </div>

        {/* Add Payment Method Form */}
        <AnimatePresence>
          {isAddingPayment && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <AddPaymentMethodForm
                onSuccess={(paymentMethod) => {
                  addPaymentMethod(paymentMethod);
                  setIsAddingPayment(false);
                }}
                onCancel={() => setIsAddingPayment(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}; 