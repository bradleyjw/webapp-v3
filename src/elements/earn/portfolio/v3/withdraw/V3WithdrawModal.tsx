import { memo, useEffect, useMemo, useState } from 'react';
import { wait } from 'utils/pureFunctions';
import { useAppSelector } from 'redux/index';
import ModalFullscreenV3 from 'components/modalFullscreen/modalFullscreenV3';
import V3WithdrawStep1 from 'elements/earn/portfolio/v3/withdraw/step1/V3WithdrawStep1';
import V3WithdrawStep3 from 'elements/earn/portfolio/v3/withdraw/step3/V3WithdrawStep3';
import V3WithdrawStep4 from 'elements/earn/portfolio/v3/withdraw/step4/V3WithdrawStep4';
import V3WithdrawStep2 from 'elements/earn/portfolio/v3/withdraw/step2/V3WithdrawStep2';
import { mockToken } from 'utils/mocked';
import { SwapSwitch } from 'elements/swapSwitch/SwapSwitch';

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export interface AmountTknFiat {
  tkn: string;
  fiat: string;
}

const V3WithdrawModal = ({ isOpen, setIsOpen }: Props) => {
  const isFiat = useAppSelector((state) => state.user.usdToggle);
  const [step, setStep] = useState(1);
  const [input, setInput] = useState('');
  const [inputOpposite, setInputOpposite] = useState('');
  const availableBalance = '0.123456';

  const onClose = async (state: boolean) => {
    setIsOpen(state);
    await wait(500);
    setStep(1);
    setInput('');
  };

  useEffect(() => {
    setInput(inputOpposite);
    setInputOpposite(input);
  }, [isFiat]);

  const amount: AmountTknFiat = useMemo(() => {
    if (isFiat) {
      return { tkn: inputOpposite, fiat: input };
    } else {
      return { tkn: input, fiat: inputOpposite };
    }
  }, [input, inputOpposite, isFiat]);

  return (
    <ModalFullscreenV3
      title="Begin 7 day cooldown"
      isOpen={isOpen}
      setIsOpen={onClose}
      titleElement={<SwapSwitch />}
    >
      {step === 1 && (
        <V3WithdrawStep1
          token={mockToken}
          setStep={setStep}
          input={input}
          setInput={setInput}
          inputOpposite={inputOpposite}
          setInputOpposite={setInputOpposite}
          isFiat={isFiat}
          availableBalance={availableBalance}
        />
      )}
      {step === 2 && <V3WithdrawStep2 setStep={setStep} amount={amount} />}
      {step === 3 && <V3WithdrawStep3 setStep={setStep} amount={amount} />}
      {step === 4 && <V3WithdrawStep4 onClose={onClose} />}
    </ModalFullscreenV3>
  );
};

export default memo(V3WithdrawModal);
